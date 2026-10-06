; The installer is 32-bit and the DLL is 64-bit, so call the 64-bit regsvr32 through Sysnative.
!macro customInstall
  ExecWait '"$WINDIR\Sysnative\regsvr32.exe" /s "$INSTDIR\resources\vendor\softcam.dll"'
!macroend

!macro customUnInstall
  ExecWait '"$WINDIR\Sysnative\regsvr32.exe" /s /u "$INSTDIR\resources\vendor\softcam.dll"'
!macroend
