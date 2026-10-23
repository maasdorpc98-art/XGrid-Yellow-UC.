"""Package the compiled Yellow engine INSIDE the supplied UC browser.

The engine compile-container manifest and Android resources are never merged.
All original UC DEX files except the targeted classes7 hook, and every original
UC JNI library, are preserved byte-for-byte. Signing is a separate SDK step.
"""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_STORED, ZIP_DEFLATED
import argparse
import hashlib
import json
import re
import shutil
import struct
import subprocess
import zlib
from dex_classes import defined_classes

ROOT = Path(__file__).resolve().parents[1]
BASE_SHA = '380f2fba501e7f1d70a4f5ca2d72f509eea815f240137cc5aa18021e9f7731e7'

def manifest_patch(data):
    """Change only version metadata; retain package, application and providers."""
    b = bytearray(data)
    names, entries = [], []
    o = 8
    while o < len(b):
        typ, hs, size = struct.unpack_from('<HHI', b, o)
        if size < hs or size == 0:
            raise ValueError('Malformed binary manifest')
        if typ == 1:
            count, _, flags, start = struct.unpack_from('<IIII', b, o + 8)
            for i in range(count):
                p = o + start + struct.unpack_from('<I', b, o + hs + i * 4)[0]
                if flags & 256:
                    def length8(p):
                        n = b[p]
                        return ((((n & 127) << 8) | b[p+1], p+2) if n & 128 else (n, p+1))
                    _, p = length8(p)
                    ln, p = length8(p)
                    names.append(bytes(b[p:p+ln]).decode('utf-8'))
                    entries.append((p, ln, 'utf-8'))
                else:
                    ln = struct.unpack_from('<H', b, p)[0]
                    p += 2
                    if ln & 32768:
                        ln = ((ln & 32767) << 16) | struct.unpack_from('<H', b, p)[0]
                        p += 2
                    names.append(bytes(b[p:p+ln*2]).decode('utf-16le'))
                    entries.append((p, ln*2, 'utf-16le'))
        if typ == 0x102 and names[struct.unpack_from('<I', b, o+20)[0]] == 'manifest':
            off, stride, count = struct.unpack_from('<HHH', b, o+24)
            found = set()
            for i in range(count):
                p = o + 16 + off + i * stride
                name = names[struct.unpack_from('<I', b, p+4)[0]]
                value = struct.unpack_from('<I', b, p+16)[0]
                if name == 'versionCode':
                    struct.pack_into('<I', b, p+16, 290402)
                    found.add(name)
                elif name == 'versionName':
                    old = names[value]
                    if not old.startswith('29.0.0'):
                        raise ValueError('Unexpected base version: ' + old)
                    pos, n, enc = entries[value]
                    new = ('29.4.2' + old[6:]).encode(enc)
                    if len(new) != n:
                        raise ValueError('Version string length changed')
                    b[pos:pos+n] = new
                    found.add(name)
                elif name == 'package' and names[value] != 'org.xgrid.orange':
                    raise ValueError('Unexpected UC package identity')
            if found != {'versionCode', 'versionName'}:
                raise ValueError('Version metadata not found')
        o += size
    return bytes(b)

def patch_hooks(base, directory, classpath):
    directory.mkdir(parents=True, exist_ok=True)
    dex = directory / 'original7.dex'
    dex.write_bytes(base.read('classes7.dex'))
    smali = directory / 'smali'
    if smali.exists():
        shutil.rmtree(smali)
    subprocess.run(['java', '-cp', classpath, 'org.jf.baksmali.Main', 'disassemble', '--api', '26', '-o', str(smali), str(dex)], check=True)
    target = smali / 'org/xgrid/orange'
    for name in ('OrangeHook.smali', 'OrangeLongPress.smali'):
        shutil.copyfile(ROOT / 'uc-hooks' / name, target / name)
    client = smali / 'com/uc/browser/webwindow/i$g.smali'
    text = client.read_text()
    needle = '.method public final onPageStarted(Lcom/uc/webview/export/WebView;Ljava/lang/String;Landroid/graphics/Bitmap;)V\n    .registers 21\n'
    if text.count(needle) != 1:
        raise ValueError('UC navigation callback differs from verified base')
    text = text.replace(needle, needle + '\n    invoke-static/range {p1 .. p2}, Lcom/xgrid/yellowuc/UCHost;->onNavigation(Landroid/view/View;Ljava/lang/String;)V\n')
    client.write_text(text)
    window = smali / 'com/uc/browser/webwindow/WebWindow.smali'
    text = window.read_text()
    needle = '.method public final onLongClick(Landroid/view/View;)Z\n    .registers 31\n'
    if text.count(needle) != 1:
        raise ValueError('UC long-press callback differs from verified base')
    text = text.replace(needle, needle + '\n    invoke-static/range {p0 .. p1}, Lorg/xgrid/orange/OrangeHook;->routeLongPress(Lcom/uc/browser/webwindow/WebWindow;Landroid/view/View;)Z\n    move-result v0\n    if-eqz v0, :yellow_uc_original_menu\n    const/4 v0, 0x1\n    return v0\n    :yellow_uc_original_menu\n')
    window.write_text(text)
    # The base DEX is already at Android's 65,536 reference limit. Move only
    # the three integration classes into a new DEX instead of overflowing it.
    hooks = directory / 'hook-smali'
    if hooks.exists():
        shutil.rmtree(hooks)
    for relative in ('org/xgrid/orange/OrangeHook.smali',
                     'org/xgrid/orange/OrangeLongPress.smali',
                     'com/uc/browser/webwindow/i$g.smali',
                     'com/uc/browser/webwindow/WebWindow.smali'):
        target = hooks / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(smali / relative), str(target))
    out = directory / 'classes7.dex'
    subprocess.run(['java', '-cp', classpath, 'org.jf.smali.Main', 'assemble', '--api', '26', '-o', str(out), str(smali)], check=True)
    if not out.exists():
        raise ValueError('UC hook assembly failed')
    extra = directory / 'uc-hooks.dex'
    subprocess.run(['java', '-cp', classpath, 'org.jf.smali.Main', 'assemble', '--api', '26', '-o', str(extra), str(hooks)], check=True)
    return out.read_bytes(), extra.read_bytes()

def signable(name):
    upper = name.upper()
    return not (upper.startswith('META-INF/') and upper.endswith(('.RSA', '.DSA', '.EC', '.SF', '.MF')))

def isolate_unused_factory(data, collisions, classpath, report):
    """The transport AAR consumer rule keeps an otherwise unreachable factory.

    After optional task telemetry is optimized out, it has no DEX callers.
    Remove only that verified unused class; UC keeps its own original factory.
    Any different collision or reference is a hard build failure.
    """
    descriptor = 'Lcom/google/android/datatransport/cct/CctBackendFactory;'
    if collisions != {descriptor}:
        raise ValueError('Unexpected native/UC class collisions: ' + repr(sorted(collisions)))
    directory = ROOT / 'build/isolated-engine'
    if directory.exists():
        shutil.rmtree(directory)
    directory.mkdir(parents=True)
    source = directory/'engine.dex'
    source.write_bytes(data)
    smali = directory/'smali'
    subprocess.run(['java','-cp',classpath,'org.jf.baksmali.Main','disassemble','--api','26','-o',str(smali),str(source)],check=True)
    factory = smali/'com/google/android/datatransport/cct/CctBackendFactory.smali'
    if not factory.is_file():
        raise ValueError('Expected unused factory definition missing')
    dotted = descriptor[1:-1].replace('/','.')
    for file in smali.rglob('*.smali'):
        if file != factory:
            text = file.read_text()
            if descriptor in text or dotted in text:
                raise ValueError('Cannot remove a referenced telemetry factory: ' + str(file))
    factory.unlink()
    dest = directory/'isolated.dex'
    subprocess.run(['java','-cp',classpath,'org.jf.smali.Main','assemble','--api','26','-o',str(dest),str(smali)],check=True)
    report.setdefault('removedUnusedEngineClasses',[]).append(descriptor)
    return dest.read_bytes()

def emit(out, central, info, raw, data=None):
    """Copy unchanged compressed bytes without recompressing the browser."""
    name = info.filename.encode('utf-8')
    method = info.compress_type
    flags = (info.flag_bits & ~8) | 0x800
    if data is None:
        crc, usize, csize = info.CRC, info.file_size, info.compress_size
        compressed = None
    else:
        crc, usize = zlib.crc32(data) & 0xffffffff, len(data)
        if method == ZIP_DEFLATED:
            co = zlib.compressobj(6, zlib.DEFLATED, -15)
            compressed = co.compress(data) + co.flush()
        elif method == ZIP_STORED:
            compressed = data
        else:
            raise ValueError('Unsupported ZIP compression')
        csize = len(compressed)
    off = out.tell()
    y, m, d, hh, mm, ss = info.date_time
    dt = ((max(1980, y)-1980) << 9) | (m << 5) | d
    tm = (hh << 11) | (mm << 5) | (ss // 2)
    out.write(struct.pack('<IHHHHHIIIHH', 0x04034b50, 20, flags, method, tm, dt, crc, csize, usize, len(name), 0))
    out.write(name)
    if compressed is None:
        raw.seek(info.header_offset)
        hdr = raw.read(30)
        nl, el = struct.unpack_from('<HH', hdr, 26)
        raw.seek(info.header_offset + 30 + nl + el)
        remaining = csize
        while remaining:
            chunk = raw.read(min(1024*1024, remaining))
            if not chunk:
                raise ValueError('Truncated UC ZIP input')
            out.write(chunk)
            remaining -= len(chunk)
    else:
        out.write(compressed)
    central.append(struct.pack('<IHHHHHHIIIHHHHHII', 0x02014b50, 20, 20, flags, method, tm, dt, crc, csize, usize, len(name), 0, 0, 0, 0, info.external_attr, off) + name)

def package(base_path, engine_path, output, classpath):
    if hashlib.sha256(base_path.read_bytes()).hexdigest() != BASE_SHA:
        raise ValueError('UC foundation does not match the supplied original APK')
    output.parent.mkdir(parents=True, exist_ok=True)
    report = {'baseSha256': BASE_SHA, 'package': 'org.xgrid.orange', 'versionCode': 290402,
              'ucStartupApplicationPreserved': True, 'nativeModel': 'MediaPipe pose full + OpenCV',
              'deviceStartupTested': False, 'originalDexPreserved': [], 'originalLibrariesPreserved': [],
              'addedDex': [], 'addedLibraries': []}
    with ZipFile(base_path) as base, ZipFile(engine_path) as engine:
        originals = set(base.namelist())
        patched_seven, hook_dex = patch_hooks(base, ROOT/'build/uc-hooks', classpath)
        patch = {'classes7.dex': patched_seven,
                 'assets/xgrid/orange.js': (ROOT/'assets/yellow.js').read_bytes(),
                 'AndroidManifest.xml': manifest_patch(base.read('AndroidManifest.xml'))}
        resources = base.read('resources.arsc')
        if resources.count(b'XGrid Orange') != 1:
            raise ValueError('Unexpected application label layout')
        patch['resources.arsc'] = resources.replace(b'XGrid Orange', b'XGrid Yellow')
        seen = set()
        for name in base.namelist():
            if re.fullmatch(r'classes\d*\.dex', name):
                descriptors = defined_classes(patch.get(name, base.read(name)))
                if seen & descriptors:
                    raise ValueError('Duplicate defined classes in UC base')
                seen |= descriptors
        additions = {}
        number = max(int(n[7:-4] or '1') for n in base.namelist() if re.fullmatch(r'classes\d*\.dex', n)) + 1
        for name in engine.namelist():
            if re.fullmatch(r'classes\d*\.dex', name):
                data = engine.read(name)
                classes = defined_classes(data)
                if seen & classes:
                    data = isolate_unused_factory(data, seen & classes, classpath, report)
                    classes = defined_classes(data)
                    if seen & classes:
                        raise ValueError('Duplicate native classes remain after isolation')
                seen |= classes
                target = f'classes{number}.dex'
                additions[target] = data
                report['addedDex'].append(target)
                number += 1
            elif name.startswith('lib/arm64-v8a/') and name.endswith('.so'):
                data = engine.read(name)
                if name in originals:
                    if data != base.read(name):
                        raise ValueError('Conflicting UC JNI library: ' + name)
                else:
                    additions[name] = data
                    report['addedLibraries'].append(name)
        hook_classes = defined_classes(hook_dex)
        if seen & hook_classes:
            raise ValueError('Duplicate UC hook definitions')
        seen |= hook_classes
        hook_name = f'classes{number}.dex'
        additions[hook_name] = hook_dex
        report['addedDex'].append(hook_name)
        report['ucIntegrationClassesMovedToHookDex'] = 3
        model = 'assets/pose_landmarker_full.task'
        additions[model] = engine.read(model)
        if hashlib.sha256(additions[model]).hexdigest() != '4eaa5eb7a98365221087693fcc286334cf0858e2eb6e15b506aa4a7ecdcec4ad':
            raise ValueError('Compiled engine contains a different model')
        if 'Lcom/xgrid/yellowuc/UCHost;' not in seen or 'Lcom/xgrid/yellowuc/UCVisualBridge;' not in seen:
            raise ValueError('Actual UC native adapter missing')
        report['originalLibrariesPreserved'] = [n for n in base.namelist() if n.startswith('lib/')]
        report['originalDexPreserved'] = [n for n in base.namelist() if n.endswith('.dex') and n != 'classes7.dex']
        additions['assets/xgrid/yellow_uc_build.json'] = json.dumps(report, indent=2).encode()
        with base_path.open('rb') as raw, output.open('wb') as out:
            central = []
            for info in base.infolist():
                if signable(info.filename):
                    emit(out, central, info, raw, patch.get(info.filename))
            for name, data in additions.items():
                info = ZipInfo(name, (2026, 10, 23, 0, 0, 0))
                info.compress_type = ZIP_STORED if name.endswith(('.so', '.task')) else ZIP_DEFLATED
                emit(out, central, info, raw, data)
            start = out.tell()
            for record in central:
                out.write(record)
            size = out.tell() - start
            out.write(struct.pack('<IHHHHIIH', 0x06054b50, 0, 0, len(central), len(central), size, start, 0))
        with ZipFile(output) as final:
            bad = final.testzip()
            if bad:
                raise ValueError('ZIP integrity failure: ' + bad)
            for name in base.namelist():
                if name.startswith('lib/') or (name.endswith('.dex') and name != 'classes7.dex'):
                    if final.read(name) != base.read(name):
                        raise ValueError('UC native bytes changed unexpectedly: ' + name)
        report['outputSha256'] = hashlib.sha256(output.read_bytes()).hexdigest()
        report['outputBytes'] = output.stat().st_size
        report['duplicateClasses'] = 0
        output.with_suffix('.audit.json').write_text(json.dumps(report, indent=2) + '\n')
    print('Packaged actual UC browser with Yellow engine:', output)
    print('Preserved UC libraries:', len(report['originalLibrariesPreserved']), '; duplicate classes: 0')

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--base', type=Path, required=True)
    p.add_argument('--engine', type=Path, required=True)
    p.add_argument('--output', type=Path, default=ROOT/'dist/Yellow-UC-unsigned.apk')
    p.add_argument('--smali-classpath', default='/usr/share/java/*')
    args = p.parse_args()
    package(args.base, args.engine, args.output, args.smali_classpath)
