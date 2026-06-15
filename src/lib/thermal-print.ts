// QZ Tray bridge for 80mm USB thermal printing.
// Requires QZ Tray desktop app: https://qz.io
// Load the QZ Tray JS client by adding to index.html:
//   <script src="/qz-tray.js"></script>
// or install via: nvm use 22.19.0 && yarn add qz-tray
// then import at app entry: import 'qz-tray'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const qz: any

function isQzAvailable(): boolean {
  return typeof qz !== 'undefined' && qz?.websocket
}

async function ensureConnected(): Promise<void> {
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect()
  }
}

export async function printReceiptHtml(html: string, printerName?: string): Promise<void> {
  if (!isQzAvailable()) {
    // Fallback: browser print in an iframe
    browserPrint(html)
    return
  }

  await ensureConnected()

  const printer = printerName ?? (await qz.printers.getDefault())
  const config  = qz.configs.create(printer, { encoding: 'UTF-8', margins: 0 })

  const data = [
    { type: 'html', format: 'plain', data: html },
  ]

  await qz.print(config, data)
}

export async function listThermalPrinters(): Promise<string[]> {
  if (!isQzAvailable()) return []
  await ensureConnected()
  return qz.printers.find() as Promise<string[]>
}

// Fallback: open receipt HTML in a hidden iframe and trigger window.print()
function browserPrint(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:1px;border:none'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }

  doc.open()
  doc.write(html)
  doc.close()

  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()

  setTimeout(() => document.body.removeChild(iframe), 3000)
}
