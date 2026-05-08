# -*- mode: python ; coding: utf-8 -*-
# Build with:  pyinstaller build_exe.spec
import os

_ico = 'business_plan_tool.ico'

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=[('business_plan_tool.html', '.')],
    hiddenimports=[
        'flask',
        'werkzeug',
        'werkzeug.serving',
        'werkzeug.routing',
        'werkzeug.exceptions',
        'jinja2',
        'click',
        'itsdangerous',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='JJV_BusinessPlanTool',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=_ico if os.path.exists(_ico) else None,
)
