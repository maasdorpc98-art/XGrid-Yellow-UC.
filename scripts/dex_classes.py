"""Read defined DEX descriptors without loading or executing Android code."""
import struct

def defined_classes(data):
    if not data.startswith(b'dex\n'):
        raise ValueError('Not a DEX file')
    ns, so = struct.unpack_from('<II', data, 56)
    nt, to = struct.unpack_from('<II', data, 64)
    nc, co = struct.unpack_from('<II', data, 96)
    strings = []
    for i in range(ns):
        p = struct.unpack_from('<I', data, so + i * 4)[0]
        while data[p] & 128:
            p += 1
        p += 1
        end = data.index(0, p)
        strings.append(data[p:end].decode('utf-8', errors='replace'))
    types = [strings[struct.unpack_from('<I', data, to + i * 4)[0]] for i in range(nt)]
    return {types[struct.unpack_from('<I', data, co + i * 32)[0]] for i in range(nc)}
