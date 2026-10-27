' Double-click to start YouTube Downloader without any console window.
' The page opens in your browser. To stop the app, press "Quit" on the page or run stop_app.bat.
' (start_app.bat does the actual work; run it directly to see all messages.)
Option Explicit

Dim shell, fso, root, rc, logPath

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = root

' Read a UTF-8 text file (Node.js writes UTF-8; plain VBScript would read it as ANSI)
Function ReadUtf8(path)
    Dim stream
    ReadUtf8 = ""
    If Not fso.FileExists(path) Then Exit Function
    Set stream = CreateObject("ADODB.Stream")
    stream.Type = 2
    stream.Charset = "utf-8"
    stream.Open
    stream.LoadFromFile path
    ReadUtf8 = stream.ReadText
    stream.Close
End Function

' First run, or an update that added packages: install in a visible window so progress is shown
If Not fso.FolderExists(root & "\server\node_modules\youtube-dl-exec") Or Not fso.FolderExists(root & "\client\node_modules") Then
    rc = shell.Run("cmd /c start_app.bat install", 1, True)
    If rc <> 0 Then
        MsgBox "Installation failed. Run start_app.bat to see the details.", vbExclamation, "YouTube Downloader"
        WScript.Quit 1
    End If
End If

' Start in the background (window style 0 = hidden) and wait until the page has been opened
logPath = root & "\launcher.log"
rc = shell.Run("cmd /c start_app.bat background > """ & logPath & """ 2>&1", 0, True)
If rc <> 0 Then
    MsgBox "YouTube Downloader could not start:" & vbCrLf & vbCrLf & Right(ReadUtf8(logPath), 1200) & _
        vbCrLf & vbCrLf & "Server log (server\server.log):" & vbCrLf & Right(ReadUtf8(root & "\server\server.log"), 800), _
        vbExclamation, "YouTube Downloader"
    WScript.Quit 1
End If
