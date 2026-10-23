"""Sign the packaged UC browser with the original Orange key, outside GitHub."""
from pathlib import Path
import argparse
import hashlib
import subprocess

EXPECTED_CERT='b0e8b0cf257ba5ad833e54096c6d4beaf56ef17637af10f6d57227c76f5bfed4'
p=argparse.ArgumentParser()
p.add_argument('--apk',type=Path,required=True)
p.add_argument('--key',type=Path,required=True)
p.add_argument('--cert',type=Path,required=True)
p.add_argument('--build-tools',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
a=p.parse_args()
a.output.parent.mkdir(parents=True,exist_ok=True)
aligned=a.output.with_suffix('.aligned.apk')
subprocess.run([str(a.build_tools/'zipalign'),'-P','16','-f','4',str(a.apk),str(aligned)],check=True)
subprocess.run([str(a.build_tools/'apksigner'),'sign','--key',str(a.key),'--cert',str(a.cert),
                '--v1-signing-enabled','true','--v2-signing-enabled','true','--v3-signing-enabled','true',
                '--v4-signing-enabled','false','--min-sdk-version','26','--out',str(a.output),str(aligned)],check=True)
verification=subprocess.run([str(a.build_tools/'apksigner'),'verify','--verbose','--print-certs',str(a.output)],check=True,capture_output=True,text=True)
if EXPECTED_CERT not in verification.stdout:
    a.output.unlink(missing_ok=True)
    raise SystemExit('Signing certificate differs from original working Orange')
subprocess.run([str(a.build_tools/'zipalign'),'-c','-P','16','4',str(a.output)],check=True)
aligned.unlink()
print(verification.stdout)
print('Signed UC APK SHA-256:',hashlib.sha256(a.output.read_bytes()).hexdigest())
