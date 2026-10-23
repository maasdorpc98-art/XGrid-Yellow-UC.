from pathlib import Path
import hashlib
import urllib.request

DEST = Path(__file__).resolve().parents[1] / 'native/src/main/assets/pose_landmarker_full.task'
SHA256 = '4eaa5eb7a98365221087693fcc286334cf0858e2eb6e15b506aa4a7ecdcec4ad'
URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'
if not DEST.exists():
    DEST.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(URL, timeout=90) as source:
        data = source.read(12_000_001)
    if hashlib.sha256(data).hexdigest() != SHA256:
        raise SystemExit('Pose model checksum mismatch')
    DEST.write_bytes(data)
if hashlib.sha256(DEST.read_bytes()).hexdigest() != SHA256:
    raise SystemExit('Local pose model checksum mismatch')
print('Verified pose model SHA-256')
