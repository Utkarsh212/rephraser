param([Parameter(Mandatory=$true)][long]$Hwnd)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Kbd {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public const byte VK_CONTROL = 0x11;
    public const byte VK_MENU = 0x12;
    public const byte VK_SHIFT = 0x10;
    public const byte VK_LWIN = 0x5B;
    public const byte VK_V = 0x56;
    public const uint KEYUP = 0x2;
}
public class Win {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr ProcessId);
    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();
}
"@

# Restore foreground. SetForegroundWindow alone usually fails when called
# from a non-foreground process; AttachThreadInput works around it.
$h = [IntPtr]$Hwnd
$targetThread = [Win]::GetWindowThreadProcessId($h, [IntPtr]::Zero)
$currentThread = [Win]::GetCurrentThreadId()
[void][Win]::AttachThreadInput($currentThread, $targetThread, $true)
[void][Win]::ShowWindow($h, 9)  # SW_RESTORE
[void][Win]::SetForegroundWindow($h)
[void][Win]::AttachThreadInput($currentThread, $targetThread, $false)

Start-Sleep -Milliseconds 150

[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_MENU,    0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_SHIFT,   0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_LWIN,    0, [Kbd]::KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 60

[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_V, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_V, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
