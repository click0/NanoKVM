import { useEffect, useRef, useState } from 'react';
import { AppleOutlined, WindowsOutlined } from '@ant-design/icons';
import { ConfigProvider, Segmented, theme } from 'antd';
import clsx from 'clsx';
import { useAtom } from 'jotai';
import { XIcon } from 'lucide-react';
import Keyboard, { KeyboardButtonTheme } from 'react-simple-keyboard';
import { Drawer } from 'vaul';

import 'react-simple-keyboard/build/css/index.css';
import '@/assets/styles/keyboard.css';

import { getKeyboardLayout, setKeyboardLayout } from '@/lib/localstorage.ts';
import { client } from '@/lib/websocket.ts';
import { isKeyboardOpenAtom } from '@/jotai/keyboard.ts';

import { KeyboardCodes } from './mappings.ts';
import {
  doubleKeys,
  keyboardArrowsOptions,
  keyboardControlPadOptions,
  keyboardOptions,
  modifierKeys,
  specialKeyMap
} from './virtual-keys.ts';

type KeyboardProps = {
  isBigScreen: boolean;
};

export const VirtualKeyboard = ({ isBigScreen }: KeyboardProps) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useAtom(isKeyboardOpenAtom);

  const [layout, setLayout] = useState('default');
  const [activeModifierKeys, setActiveModifierKeys] = useState<string[]>([]);

  const keyboardRef = useRef<any>(null);

  useEffect(() => {
    const keyboardLayout = getKeyboardLayout();
    if (keyboardLayout && ['default', 'mac'].includes(keyboardLayout)) {
      setLayout(keyboardLayout);
    }
  }, []);

  function onKeyPress(key: string) {
    if (modifierKeys.includes(key)) {
      if (activeModifierKeys.includes(key)) {
        sendModifierKeyDown();
        sendModifierKeyUp();
      } else {
        setActiveModifierKeys([...activeModifierKeys, key]);
      }
      return;
    }

    sendKeydown(key);
  }

  function onKeyReleased(key: string) {
    if (modifierKeys.includes(key)) {
      return;
    }

    sendKeyup();
  }

  function sendKeydown(key: string) {
    const specialKey = specialKeyMap.get(key);
    const code = KeyboardCodes.get(specialKey ? specialKey : key);
    if (!code) {
      console.log('unknown code: ', key);
      return;
    }

    const modifiers = sendModifierKeyDown();

    client.send([1, code, ...modifiers]);
  }

  function sendKeyup() {
    sendModifierKeyUp();
    client.send([1, 0, 0, 0, 0, 0]);
  }

  function sendModifierKeyDown() {
    let ctrl = 0;
    let shift = 0;
    let alt = 0;
    let meta = 0;

    activeModifierKeys.forEach((modifierKey) => {
      const specialKey = specialKeyMap.get(modifierKey)!;
      const code = KeyboardCodes.get(specialKey)!;

      if ([224, 228].includes(code)) {
        ctrl = 1;
      } else if ([225, 229].includes(code)) {
        shift = 1;
      } else if ([226, 230].includes(code)) {
        alt = 1;
      } else if ([227, 231].includes(code)) {
        meta = 1;
      }

      client.send([1, code, ctrl, shift, alt, meta]);
    });

    return [ctrl, shift, alt, meta];
  }

  function sendModifierKeyUp() {
    if (activeModifierKeys.length === 0) return;

    activeModifierKeys.forEach(() => {
      client.send([1, 0, 0, 0, 0, 0]);
    });

    setActiveModifierKeys([]);
  }

  function getButtonTheme(): KeyboardButtonTheme[] {
    const theme = [{ class: 'hg-double', buttons: doubleKeys.join(' ') }];

    if (activeModifierKeys.length > 0) {
      const buttons = activeModifierKeys.join(' ');
      theme.push({ class: 'hg-highlight', buttons });
    }

    return theme;
  }

  function selectLayout(value: string) {
    setKeyboardLayout(value);
    setLayout(value);
  }

  return (
    <Drawer.Root open={isKeyboardOpen} onOpenChange={setIsKeyboardOpen} modal={false}>
      <Drawer.Portal>
        <Drawer.Content
          className={clsx(
            'fixed bottom-0 left-0 right-0 z-[999] mx-auto overflow-hidden rounded bg-white outline-none',
            isBigScreen ? 'w-[820px]' : 'w-[650px]'
          )}
        >
          {/* header */}
          <div className="flex items-center justify-between px-3 py-1">
            <div className="flex flex-row">
              <ConfigProvider
                theme={{
                  algorithm: theme.defaultAlgorithm
                }}
              >
                <Segmented
                  options={[
                    { label: 'Win', value: 'default', icon: <WindowsOutlined /> },
                    { label: 'Mac', value: 'mac', icon: <AppleOutlined /> }
                  ]}
                  value={layout}
                  onChange={selectLayout}
                />
              </ConfigProvider>
            </div>

            <div className="flex w-[100px] items-center justify-end">
              <div
                className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded text-neutral-600 hover:bg-neutral-300 hover:text-white"
                onClick={() => setIsKeyboardOpen(false)}
              >
                <XIcon size={18} />
              </div>
            </div>
          </div>

          <div className="h-px flex-shrink-0 border-b bg-neutral-300" />

          <div data-vaul-no-drag className="keyboardContainer w-full">
            {/* main keyboard */}
            <Keyboard
              buttonTheme={getButtonTheme()}
              keyboardRef={(r) => (keyboardRef.current = r)}
              onKeyPress={onKeyPress}
              onKeyReleased={onKeyReleased}
              layoutName={layout}
              {...keyboardOptions}
            />

            {/* control keyboard */}
            {isBigScreen && (
              <div className="controlArrows">
                <Keyboard
                  onKeyPress={onKeyPress}
                  onKeyReleased={onKeyReleased}
                  {...keyboardControlPadOptions}
                />

                <Keyboard
                  onKeyPress={onKeyPress}
                  onKeyReleased={onKeyReleased}
                  {...keyboardArrowsOptions}
                />
              </div>
            )}
          </div>
        </Drawer.Content>
        <Drawer.Overlay />
      </Drawer.Portal>
    </Drawer.Root>
  );
};