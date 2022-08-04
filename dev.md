https://stackoverflow.com/questions/16051078/how-to-get-the-name-of-program-running-on-windows-with-c-sharp

Using Process.GetProcesses(); method you can get all running application and if you want current active window then make use of GetForegroundWindow() and GetWindowText().


https://docs.rs/windows/latest/windows/index.html
https://microsoft.github.io/windows-docs-rs/doc/windows/index.html
- 아래껏이 맞음
- Crate windows 문서    