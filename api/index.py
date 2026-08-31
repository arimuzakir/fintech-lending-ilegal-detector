import sys
import os

# Menambahkan root direktori ke path agar modul services dan static terbaca
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from main import app
