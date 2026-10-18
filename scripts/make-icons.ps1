Add-Type -AssemblyName System.Drawing

function New-RoundedPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  if ($d -gt $w) { $d = $w }
  if ($d -gt $h) { $d = $h }
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function New-NawaIcon([int]$size, [string]$outPath) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $ink = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 10, 10, 10))
  $g.FillRectangle($ink, 0, 0, $size, $size)

  $cx = $size / 2.0
  $bw = $size * 0.40
  $bh = $size * 0.50
  $bx = $cx - $bw / 2.0
  $by = $size * 0.30

  # الكاب
  $capW = $size * 0.20
  $capH = $size * 0.085
  $capX = $cx - $capW / 2.0
  $capY = $size * 0.215
  $capBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 25, 18))
  $capPath = New-RoundedPath $capX $capY $capW $capH ($capH * 0.35)
  $g.FillPath($capBrush, $capPath)

  # حلقة ذهبية بين الكاب والزجاجة
  $ringY = $capY + $capH
  $ringBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 201, 162, 39))
  $g.FillRectangle($ringBrush, $capX + ($capW * 0.08), [single]$ringY, [single]($capW * 0.84), [single]($size * 0.012))

  # الرقبة
  $neckBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 169, 132, 31))
  $g.FillRectangle($neckBrush, $cx - $bw * 0.16, [single]($ringY + $size * 0.012), [single]($bw * 0.32), [single]($by - ($ringY + $size * 0.012)))

  # جسم الزجاجة بتدرج ذهبي
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF([single]$bx, [single]$by)),
    (New-Object System.Drawing.PointF([single]($bx + $bw), [single]($by + $bh))),
    [System.Drawing.Color]::FromArgb(255, 231, 200, 115),
    [System.Drawing.Color]::FromArgb(255, 134, 104, 26)
  )
  $body = New-RoundedPath $bx $by $bw $bh ($bw * 0.30)
  $g.FillPath($grad, $body)

  # لمعة كريمية على الجنب
  $shineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(110, 255, 255, 255))
  $shine = New-RoundedPath ($bx + $bw * 0.16) ($by + $bh * 0.13) ($bw * 0.13) ($bh * 0.55) ($bw * 0.065)
  $g.FillPath($shineBrush, $shine)

  # نقطة لامعة
  $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 255, 255, 255))
  $dr = $size * 0.018
  $g.FillEllipse($dotBrush, [single]($cx + $bw * 0.14), [single]($by + $bh * 0.12), [single]($dr * 2), [single]($dr * 2))

  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

New-Item -ItemType Directory -Force -Path "public/icons" | Out-Null
New-NawaIcon 192 "public/icons/icon-192.png"
New-NawaIcon 512 "public/icons/icon-512.png"
New-NawaIcon 180 "public/icons/icon-180.png"
Get-ChildItem public/icons | Select-Object Name, @{N='KB';E={[math]::Round($_.Length/1KB,1)}} | Format-Table -HideTableHeaders
