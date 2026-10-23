from pathlib import Path
from zipfile import ZipFile
import argparse
import hashlib
import re
import struct
import zlib
from dex_classes import defined_classes
from package_uc import manifest_patch

p=argparse.ArgumentParser()
p.add_argument('--base',type=Path,required=True)
p.add_argument('--apk',type=Path,required=True)
args=p.parse_args()
with ZipFile(args.base) as base, ZipFile(args.apk) as apk:
    assert apk.testzip() is None, 'Corrupt ZIP entry'
    assert len(apk.namelist())==len(set(apk.namelist())), 'Duplicate ZIP entries'
    assert apk.read('AndroidManifest.xml')==manifest_patch(base.read('AndroidManifest.xml')), 'Unexpected UC manifest changes'
    assert apk.read('resources.arsc')==base.read('resources.arsc').replace(b'XGrid Orange',b'XGrid Yellow'), 'Unexpected resource changes'
    original_dex=original_jni=0
    for name in base.namelist():
        if name.startswith('lib/'):
            assert apk.read(name)==base.read(name), 'Changed original UC JNI: '+name
            original_jni+=1
        elif name.endswith('.dex') and name!='classes7.dex':
            assert apk.read(name)==base.read(name), 'Changed unrelated UC DEX: '+name
            original_dex+=1
    seen=set(); dex_count=0
    for name in apk.namelist():
        if not re.fullmatch(r'classes\d*\.dex',name):continue
        data=apk.read(name);classes=defined_classes(data)
        assert not seen & classes, 'Duplicate DEX definitions: '+repr(seen & classes)
        seen|=classes;dex_count+=1
        assert hashlib.sha1(data[32:]).digest()==data[12:32], 'DEX SHA-1: '+name
        assert zlib.adler32(data[12:])&0xffffffff==struct.unpack_from('<I',data,8)[0], 'DEX checksum: '+name
        for offset in (64,80,88):
            assert struct.unpack_from('<I',data,offset)[0]<=65536, 'DEX reference overflow: '+name
    for descriptor in ('Lcom/xgrid/yellowuc/UCHost;','Lcom/xgrid/yellowuc/UCVisualBridge;',
                       'Lorg/xgrid/orange/OrangeLongPress;','Lcom/uc/browser/webwindow/WebWindow;'):
        assert descriptor in seen, 'Missing integration class: '+descriptor
    assert not any(x.startswith('Lcom/mmbox/xbrowser/') for x in seen), 'Wrong XBrowser foundation'
    assert not any('MainActivity;' in x and 'yellownative' in x for x in seen), 'Standalone activity bundled'
    assert hashlib.sha256(apk.read('assets/pose_landmarker_full.task')).hexdigest()=='4eaa5eb7a98365221087693fcc286334cf0858e2eb6e15b506aa4a7ecdcec4ad'
    for name in ('libmediapipe_tasks_vision_jni.so','libopencv_java4.so','libc++_shared.so'):
        data=apk.read('lib/arm64-v8a/'+name)
        assert data[:4]==b'\x7fELF' and data[4]==2, 'Missing ARM64 library: '+name
    controller=apk.read('assets/xgrid/orange.js')
    assert controller==(Path(__file__).resolve().parents[1]/'assets/yellow.js').read_bytes()
    assert b'native-subject-pose-flow-v3' in controller and b'native-subject-pose-flow-v2' not in controller
print(f'PASS: real UC host, {original_jni} original UC JNI libraries unchanged, {original_dex} original DEX assets unchanged, {dex_count} main DEX files, no duplicate classes, valid DEX checksums/reference counts, Yellow-only controller, actual native model and ARM64 engine.')
