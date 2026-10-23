"""Reconstruct the exact supplied UC APK, failing on any changed or missing byte."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'uc-base/manifest.json').read_text())
out = ROOT / 'build/uc-original.apk'
out.parent.mkdir(parents=True, exist_ok=True)
with out.open('wb') as stream:
    for part in manifest['parts']:
        data = (ROOT / 'uc-base' / part['path']).read_bytes()
        if len(data) != part['bytes'] or hashlib.sha256(data).hexdigest() != part['sha256']:
            raise SystemExit('UC input part checksum mismatch: ' + part['path'])
        stream.write(data)
if out.stat().st_size != manifest['bytes'] or hashlib.sha256(out.read_bytes()).hexdigest() != manifest['sha256']:
    raise SystemExit('UC foundation checksum mismatch')
print('Restored and verified original UC foundation:', out)
