import React, { useState, useEffect } from 'react'
import { Box, Text } from '../../ink.js'
import { Dialog } from '../../components/design-system/Dialog.js'
import { Select } from '../../components/CustomSelect/select.js'
import { CDPClient } from '../../utils/cdp/client.js'
import { Browser } from '../../utils/cdp/browser.js'

type Props = {
  onDone: (result?: string) => void
}

type MenuAction = 'connect' | 'navigate' | 'screenshot' | 'disconnect' | 'cancel'

export default function BrowserCommand({ onDone }: Props) {
  const [status, setStatus] = useState<string>('Ready')
  const [url, setUrl] = useState<string>('')
  const [client, setClient] = useState<CDPClient | null>(null)
  const [browser, setBrowser] = useState<Browser | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string>('')

  const menuOptions = [
    { label: 'Connect to Chrome', value: 'connect' },
    ...(browser ? [
      { label: `Navigate to URL${currentUrl ? ` (current: ${currentUrl})` : ''}`, value: 'navigate' },
      { label: 'Take Screenshot', value: 'screenshot' },
      { label: 'Disconnect', value: 'disconnect' },
    ] : []),
    { label: 'Cancel', value: 'cancel' },
  ]

  async function handleAction(action: MenuAction) {
    switch (action) {
      case 'connect': {
        setStatus('Connecting to Chrome...')
        try {
          const cdpClient = new CDPClient()
          await cdpClient.connect()
          setClient(cdpClient)
          const newBrowser = new Browser(cdpClient)
          setBrowser(newBrowser)
          setStatus('Connected to Chrome!')
        } catch (error) {
          setStatus(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`)
        }
        break
      }

      case 'navigate': {
        if (!browser) return
        // For simplicity, navigate to a default URL
        setStatus('Navigating to agentmail.to...')
        try {
          await browser.page.goto('https://www.agentmail.to')
          const newUrl = await browser.page.url()
          setCurrentUrl(newUrl)
          setStatus(`Navigated to: ${newUrl}`)
        } catch (error) {
          setStatus(`Navigation failed: ${error instanceof Error ? error.message : String(error)}`)
        }
        break
      }

      case 'screenshot': {
        if (!browser) return
        setStatus('Taking screenshot...')
        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          const os = await import('os')

          const screenshotDir = path.join(os.homedir(), '.claude', 'screenshots')
          await fs.mkdir(screenshotDir, { recursive: true })

          const timestamp = Date.now()
          const screenshotPath = path.join(screenshotDir, `browser-${timestamp}.png`)

          await browser.page.screenshot({ path: screenshotPath })
          setStatus(`Screenshot saved: ${screenshotPath}`)
        } catch (error) {
          setStatus(`Screenshot failed: ${error instanceof Error ? error.message : String(error)}`)
        }
        break
      }

      case 'disconnect': {
        if (browser) {
          browser.disconnect()
          setBrowser(null)
          setClient(null)
          setCurrentUrl('')
          setStatus('Disconnected from Chrome')
        }
        break
      }

      case 'cancel':
        if (browser) {
          browser.disconnect()
        }
        onDone()
        break
    }
  }

  return (
    <Dialog onClose={() => onDone()}>
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">Browser Relay</Text>
        <Text dimColor>{status}</Text>
        {currentUrl && (
          <Text dimColor>Current URL: {currentUrl}</Text>
        )}
        <Box marginTop={1}>
          <Select
            options={menuOptions}
            onSelect={(option) => handleAction(option.value as MenuAction)}
          />
        </Box>
      </Box>
    </Dialog>
  )
}
