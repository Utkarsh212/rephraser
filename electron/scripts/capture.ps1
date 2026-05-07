Add-Type -AssemblyName System.Windows.Forms
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
    public const byte VK_C = 0x43;
    public const uint KEYUP = 0x2;
}
public class Win {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
}
"@

# Capture the source window first so we can paste back into it later.
$hwnd = [Win]::GetForegroundWindow()

$prev = ''
try { $prev = [System.Windows.Forms.Clipboard]::GetText() } catch {}
try { [System.Windows.Forms.Clipboard]::Clear() } catch {}

# Force-release any held modifiers from the triggering hotkey.
[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_MENU,    0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_SHIFT,   0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_LWIN,    0, [Kbd]::KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 80

[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_C, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_C, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)

Start-Sleep -Milliseconds 250
$captured = ''
try { $captured = [System.Windows.Forms.Clipboard]::GetText() } catch {}
try { if ($prev) { [System.Windows.Forms.Clipboard]::SetText($prev) } } catch {}

# Output: HWND on first line, captured text after.
[Console]::Out.WriteLine($hwnd.ToInt64())
[Console]::Out.Write($captured)
