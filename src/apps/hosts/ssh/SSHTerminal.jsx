import { forwardRef, useImperativeHandle, useEffect, useRef, useState, useLayoutEffect } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import io from "socket.io-client";
import PropTypes from "prop-types";

const terminalThemes = {
    dark: {
        background: '#262626',
        foreground: '#f7f7f7',
        black: '#000000',
        red: '#ff5c57',
        green: '#5af78e',
        yellow: '#f3f99d',
        blue: '#57c7ff',
        magenta: '#ff6ac1',
        cyan: '#9aedfe',
        white: '#f1f1f0',
        brightBlack: '#686868',
        brightRed: '#ff6b67',
        brightGreen: '#5fff98',
        brightYellow: '#f9ffa8',
        brightBlue: '#9acdff',
        brightMagenta: '#ff92d0',
        brightCyan: '#9aedfe',
        brightWhite: '#ffffff',
        cursor: '#f0f0f0'
    },
    midnight: {
        foreground: '#f0f0f0',
        background: '#151515',
        black: '#000000',
        red: '#ff5c57',
        green: '#5af78e',
        yellow: '#f3f99d',
        blue: '#57c7ff',
        magenta: '#ff6ac1',
        cyan: '#9aedfe',
        white: '#f1f1f0',
        brightBlack: '#686868',
        brightRed: '#ff6b67',
        brightGreen: '#5fff98',
        brightYellow: '#f9ffa8',
        brightBlue: '#9acdff',
        brightMagenta: '#ff92d0',
        brightCyan: '#9aedfe',
        brightWhite: '#ffffff',
        cursor: '#f0f0f0'
    },
    light: {
        foreground: '#333333',
        background: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#00bc00',
        yellow: '#949800',
        blue: '#0451a5',
        magenta: '#bc05bc',
        cyan: '#0598bc',
        white: '#555555',
        brightBlack: '#666666',
        brightRed: '#cd3131',
        brightGreen: '#14ce14',
        brightYellow: '#b5ba00',
        brightBlue: '#0451a5',
        brightMagenta: '#bc05bc',
        brightCyan: '#0598bc',
        brightWhite: '#a5a5a5',
        cursor: '#333333'
    },
    red: {
        foreground: '#ffcccc',
        background: '#550000',
        black: '#000000',
        red: '#ff5555',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#ffcccc',
        brightBlack: '#808080',
        brightRed: '#ff8080',
        brightGreen: '#b5cea8',
        brightYellow: '#dcdcaa',
        brightBlue: '#9cdcfe',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
        cursor: '#ffcccc'
    },
    green: {
        foreground: '#d6ffd6',
        background: '#0B3B0B',
        black: '#000000',
        red: '#e06c75',
        green: '#98ff98',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#d6ffd6',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#b5ffb5',
        brightYellow: '#dcdcaa',
        brightBlue: '#9cdcfe',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
        cursor: '#d6ffd6'
    },
    blue: {
        foreground: '#cce6ff',
        background: '#001B33',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#80bfff',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#cce6ff',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#b5cea8',
        brightYellow: '#dcdcaa',
        brightBlue: '#b3d9ff',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
        cursor: '#cce6ff'
    },
    purple: {
        foreground: '#e5d4ff',
        background: '#2D1B4E',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#d8bfff',
        cyan: '#56b6c2',
        white: '#e5d4ff',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#b5cea8',
        brightYellow: '#dcdcaa',
        brightBlue: '#9cdcfe',
        brightMagenta: '#e2ccff',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
        cursor: '#e5d4ff'
    },
    orange: {
        foreground: '#ffe0b3',
        background: '#421F04',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#ffcc80',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#ffe0b3',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#b5cea8',
        brightYellow: '#ffd699',
        brightBlue: '#9cdcfe',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
        cursor: '#ffe0b3'
    },
    cyan: {
        foreground: '#b3fff0',
        background: '#003833',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#80ffe6',
        white: '#b3fff0',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#b5cea8',
        brightYellow: '#dcdcaa',
        brightBlue: '#9cdcfe',
        brightMagenta: '#c586c0',
        brightCyan: '#99ffeb',
        brightWhite: '#ffffff',
        cursor: '#b3fff0'
    },
    yellow: {
        foreground: '#ffffcc',
        background: '#3B3B00',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#ffff99',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#ffffcc',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#b5cea8',
        brightYellow: '#ffffb3',
        brightBlue: '#9cdcfe',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
        cursor: '#ffffcc'
    },
    pink: {
        foreground: '#ffcce6',
        background: '#3B001B',
        black: '#000000',
        red: '#ff6699',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#ff99cc',
        cyan: '#56b6c2',
        white: '#ffcce6',
        brightBlack: '#808080',
        brightRed: '#ff80aa',
        brightGreen: '#b5cea8',
        brightYellow: '#dcdcaa',
        brightBlue: '#9cdcfe',
        brightMagenta: '#ffb3d9',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
        cursor: '#ffcce6'
    },
    veryDark: {
        background: '#000000',
        foreground: '#b0b0b0',
        cursor: '#b0b0b0',
        black: '#000000',
        red: '#990000',
        green: '#00a600',
        yellow: '#999900',
        blue: '#0000b2',
        magenta: '#b200b2',
        cyan: '#00a6b2',
        white: '#bfbfbf',
        brightBlack: '#666666',
        brightRed: '#e50000',
        brightGreen: '#00d900',
        brightYellow: '#e5e500',
        brightBlue: '#0000ff',
        brightMagenta: '#e500e5',
        brightCyan: '#00e5e5',
        brightWhite: '#e5e5e5'
    },
    dracula: {
        background: '#282a36',
        foreground: '#f8f8f2',
        cursor: '#f8f8f2',
        black: '#21222c',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff'
    },
    nord: {
        background: '#2e3440',
        foreground: '#d8dee9',
        cursor: '#d8dee9',
        black: '#3b4252',
        red: '#bf616a',
        green: '#a3be8c',
        yellow: '#ebcb8b',
        blue: '#81a1c1',
        magenta: '#b48ead',
        cyan: '#88c0d0',
        white: '#e5e9f0',
        brightBlack: '#4c566a',
        brightRed: '#bf616a',
        brightGreen: '#a3be8c',
        brightYellow: '#ebcb8b',
        brightBlue: '#81a1c1',
        brightMagenta: '#b48ead',
        brightCyan: '#8fbcbb',
        brightWhite: '#eceff4'
    },
    solarized: {
        background: '#002b36',
        foreground: '#839496',
        cursor: '#839496',
        black: '#073642',
        red: '#dc322f',
        green: '#859900',
        yellow: '#b58900',
        blue: '#268bd2',
        magenta: '#d33682',
        cyan: '#2aa198',
        white: '#eee8d5',
        brightBlack: '#002b36',
        brightRed: '#cb4b16',
        brightGreen: '#586e75',
        brightYellow: '#657b83',
        brightBlue: '#839496',
        brightMagenta: '#6c71c4',
        brightCyan: '#93a1a1',
        brightWhite: '#fdf6e3'
    },
    github: {
        background: '#ffffff',
        foreground: '#24292e',
        cursor: '#24292e',
        black: '#24292e',
        red: '#d73a49',
        green: '#28a745',
        yellow: '#dbab09',
        blue: '#0366d6',
        magenta: '#5a32a3',
        cyan: '#0598bc',
        white: '#6a737d',
        brightBlack: '#959da5',
        brightRed: '#cb2431',
        brightGreen: '#22863a',
        brightYellow: '#b08800',
        brightBlue: '#005cc5',
        brightMagenta: '#5a32a3',
        brightCyan: '#0598bc',
        brightWhite: '#d1d5da'
    },
    monokai: {
        background: '#272822',
        foreground: '#f8f8f2',
        cursor: '#f8f8f2',
        black: '#272822',
        red: '#f92672',
        green: '#a6e22e',
        yellow: '#f4bf75',
        blue: '#66d9ef',
        magenta: '#ae81ff',
        cyan: '#a1efe4',
        white: '#f8f8f2',
        brightBlack: '#75715e',
        brightRed: '#f92672',
        brightGreen: '#a6e22e',
        brightYellow: '#f4bf75',
        brightBlue: '#66d9ef',
        brightMagenta: '#ae81ff',
        brightCyan: '#a1efe4',
        brightWhite: '#f9f8f5'
    },
};

export const NewTerminal = forwardRef(({ hostConfig, isVisible, setIsNoAuthHidden, setErrorMessage, setIsErrorHidden, title, showTitle }, ref) => {
    const terminalRef = useRef(null);
    const socketRef = useRef(null);
    const fitAddon = useRef(new FitAddon());
    const terminalInstance = useRef(null);
    const [showConnectionInfo, setShowConnectionInfo] = useState(false);

    const resizeTerminal = () => {
        const terminalContainer = terminalRef.current;
        const parentContainer = terminalContainer?.parentElement;

        if (!parentContainer || parentContainer.clientWidth === 0 || !terminalInstance.current) return;

        const parentWidth = parentContainer.clientWidth;
        const parentHeight = parentContainer.clientHeight;

        terminalContainer.style.width = `${parentWidth}px`;
        terminalContainer.style.height = `${parentHeight}px`;

        fitAddon.current.fit();

        const { cols, rows } = terminalInstance.current;
        
        const finalCols = Math.max(cols, 10);
        const finalRows = Math.max(rows, 5);

        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit("resize", { cols: finalCols, rows: finalRows });
        }
    };

    useImperativeHandle(ref, () => ({
        resizeTerminal: resizeTerminal,
        socketRef: socketRef
    }));

    useEffect(() => {
        if (!hostConfig || !terminalRef.current) return;

        const terminalConfig = hostConfig.terminalConfig || {};
        const selectedTheme = terminalConfig.theme || 'dark';
        const themeColors = terminalThemes[selectedTheme] || terminalThemes.dark;

        const fontSize = terminalConfig.fontSize || 14;
        const fontWeight = terminalConfig.fontWeight || 'normal';
        const lineHeight = terminalConfig.lineHeight || 1.3;
        const cursorStyle = terminalConfig.cursorStyle || 'block';
        const cursorBlink = terminalConfig.cursorBlink !== undefined ? terminalConfig.cursorBlink : true;

        terminalInstance.current = new Terminal({
            cursorBlink: cursorBlink,
            cursorStyle: cursorStyle,
            theme: themeColors,
            fontSize: fontSize,
            fontWeight: fontWeight,
            lineHeight: lineHeight,
            scrollback: 5000,
            ignoreBracketedPasteMode: true,
            padding: 2,
            rendererType: 'canvas',
            allowProposedApi: true,
            experimentalCharAtlas: 'dynamic',
            windowsMode: true,
            convertEol: true,
            cols: 80,
            rows: 24,
            wraparoundMode: true,
            windowOptions: {
                setWinLines: true
            },
            fontFamily: "'Hack Nerd Font Mono', 'Hack Nerd Font', 'Consolas', monospace",
            letterSpacing: 0,
            drawBoldTextInBrightColors: false,
            fastScrollModifier: 'alt',
            fastScrollSensitivity: 5,
            minimumContrastRatio: 1,
            macOptionIsMeta: true,
            disableStdin: false,
            screenReaderMode: false,
            smoothScrollDuration: 0,
        });

        const socket = io(
            window.location.hostname === "localhost"
                ? "http://localhost:8082"
                : "/",
            {
                path: "/ssh.io/socket.io",
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
            }
        );
        socketRef.current = socket;

        const uniqueTimestamp = Date.now();
        const terminalId = `terminal-${hostConfig.ip}-${hostConfig.user}-${uniqueTimestamp}`;

        socket.terminalId = terminalId;
        socket.hostData = {
            ip: hostConfig.ip,
            user: hostConfig.user,
            id: uniqueTimestamp
        };

        if (!window.terminalSockets) {
            window.terminalSockets = {};
        }

        window.terminalSockets[terminalId] = socket;

        window.terminalSockets[uniqueTimestamp] = socket;

        terminalInstance.current.loadAddon(fitAddon.current);
        terminalInstance.current.open(terminalRef.current);

        setTimeout(() => {
            if (fitAddon.current && terminalInstance.current) {
                resizeTerminal();

                terminalInstance.current.focus();
            }
        }, 0);

        socket.on("connect_error", (error) => {
            terminalInstance.current.write(`\r\n*** Socket connection error: ${error.message} ***\r\n`);
        });

        socket.on("connect_timeout", () => {
            terminalInstance.current.write(`\r\n*** Socket connection timeout ***\r\n`);
        });

        socket.on("error", (err) => {
            const isAuthError = err.toLowerCase().includes("authentication") || err.toLowerCase().includes("auth");
            if (isAuthError && !hostConfig.password?.trim() && !hostConfig.sshKey?.trim() && !authModalShown) {
                authModalShown = true;
                setIsNoAuthHidden(false);
            }
            terminalInstance.current.write(`\r\n*** Error: ${err} ***\r\n`);
        });

        socket.on("connect", () => {
            fitAddon.current.fit();
            const { cols, rows } = terminalInstance.current;

            if (!hostConfig.password?.trim() && !hostConfig.sshKey?.trim()) {
                setIsNoAuthHidden(false);
                return;
            }

            const sshConfig = {
                ip: hostConfig.ip,
                user: hostConfig.user,
                port: Number(hostConfig.port) || 22,
                password: hostConfig.password?.trim(),
                sshKey: hostConfig.sshKey?.trim(),
                rsaKey: hostConfig.sshKey?.trim() || hostConfig.rsaKey?.trim(),
                sshAlgorithm: hostConfig.terminalConfig?.sshAlgorithm || 'default'
            };

            socket.emit("connectToHost", Math.max(cols, 10), Math.max(rows, 5), sshConfig);
        });

        setTimeout(() => {
            if (terminalInstance.current) {
                fitAddon.current.fit();
                terminalInstance.current.focus();

                terminalInstance.current.options.wraparoundMode = true;
                terminalInstance.current.options.wrap = true;
                terminalInstance.current.options.wordBreak = false;

                const { rows } = terminalInstance.current;
                for (let i = 0; i < rows; i++) {
                    terminalInstance.current.refresh(i, i);
                }
            }
        }, 100);

        socket.on("data", (data) => {
            const decoder = new TextDecoder("utf-8");
            const text = decoder.decode(new Uint8Array(data));
            
            if (terminalInstance.current) {
                window.requestAnimationFrame(() => {
                    terminalInstance.current.write(text);
                    
                    if (text.includes('\n') || text.includes('\r')) {
                        setTimeout(() => {
                            if (terminalInstance.current) {
                                const lastRow = terminalInstance.current.buffer.active.cursorY;
                                const displayRows = terminalInstance.current.rows;
                                for (let i = Math.max(0, lastRow - 5); i <= Math.min(lastRow + 1, displayRows - 1); i++) {
                                    terminalInstance.current.refresh(i, i);
                                }
                            }
                        }, 0);
                    }
                });
            }
        });

        socket.on("resize", function(data) {
            if (data && data.cols && data.rows && terminalInstance.current) {
                terminalInstance.current.resize(data.cols, data.rows);
            }
        });

        let isPasting = false;

        if (terminalInstance.current) {
            terminalInstance.current.onData((data) => {
                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit("data", data);

                    const needsRefresh =
                        data.includes('\r') ||
                        data.includes('\n') ||
                        data.includes('\u001b') ||
                        data.length > 5;

                    if (needsRefresh) {
                        setTimeout(() => {
                            if (terminalInstance.current) {
                                terminalInstance.current.refresh(0, terminalInstance.current.rows - 1);
                            }
                        }, 50);
                    }
                }
            });

            terminalInstance.current.attachCustomKeyEventHandler((event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "v") {
                    if (isPasting) return false;
                    isPasting = true;

                    event.preventDefault();
                    navigator.clipboard.readText().then(text => {
                        if (text && socketRef.current?.connected) {
                            const processedText = text.replace(/\r\n/g, "\r").replace(/\n/g, "\r");
                            socketRef.current.emit("data", processedText);
                        }
                    }).catch(() => {
                        setErrorMessage("Paste failed: Clipboard access denied. Instead, use Control Shift V.");
                        setIsErrorHidden(false);
                    }).finally(() => {
                        setTimeout(() => {
                            isPasting = false;
                        }, 300);
                    });
                    return false;
                }
                return true;
            });

            terminalInstance.current.onKey(({ domEvent }) => {
                if (domEvent.key === "c" && (domEvent.ctrlKey || domEvent.metaKey)) {
                    const selection = terminalInstance.current.getSelection();
                    if (selection) {
                        navigator.clipboard.writeText(selection);
                    }
                }
            });
        }

        let authModalShown = false;

        socket.on("noAuthRequired", () => {
            if (!hostConfig.password?.trim() && !hostConfig.sshKey?.trim() && !authModalShown) {
                authModalShown = true;
                setIsNoAuthHidden(false);
            }
        });

        socket.on("reconnect_error", (error) => {
            if (terminalInstance.current) {
                terminalInstance.current.write(`\r\n*** Socket reconnect error: ${error.message} ***\r\n`);
            }
        });

        let lastPongTime = Date.now();
        const pingInterval = setInterval(() => {
            if (socketRef.current && socketRef.current.connected) {
                const now = Date.now();
                if (now - lastPongTime > 15000) {
                    if (socketRef.current) {
                        socketRef.current.disconnect();
                        socketRef.current.connect();
                    }
                    lastPongTime = now;
                }

                socketRef.current.emit("ping");
            }
        }, 3000);

        socketRef.current.on("pong", () => {
            lastPongTime = Date.now();
        });

        socketRef.current.on("ping", () => {
            lastPongTime = Date.now();
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit("pong");
            }
        });

        terminalInstance.current.onLineFeed(() => {
            if (terminalInstance.current) {
                const { rows } = terminalInstance.current;
                for (let i = Math.max(0, rows - 5); i < rows; i++) {
                    terminalInstance.current.refresh(i, i);
                }
            }
        });

        return () => {
            clearInterval(pingInterval);

            if (socketRef.current && socketRef.current.terminalId && 
                window.terminalSockets && window.terminalSockets[socketRef.current.terminalId]) {
                delete window.terminalSockets[socketRef.current.terminalId];

                if (socketRef.current.hostData && socketRef.current.hostData.id &&
                    window.terminalSockets[socketRef.current.hostData.id]) {
                    delete window.terminalSockets[socketRef.current.hostData.id];
                }
            }

            if (terminalInstance.current) {
                terminalInstance.current.dispose();
                terminalInstance.current = null;
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            authModalShown = false;
        };
    }, [hostConfig]);

    useEffect(() => {
        if (!socketRef.current) {
            const socket = io(
                window.location.hostname === "localhost"
                    ? "http://localhost:8082"
                    : "/",
                {
                    path: "/ssh.io/socket.io",
                    transports: ["websocket", "polling"],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    timeout: 20000,
                }
            );
            socketRef.current = socket;

            const uniqueTimestamp = Date.now();
            const terminalId = `terminal-${hostConfig.ip}-${hostConfig.user}-${uniqueTimestamp}`;

            socket.terminalId = terminalId;
            socket.hostData = {
                ip: hostConfig.ip,
                user: hostConfig.user,
                id: uniqueTimestamp
            };

            if (!window.terminalSockets) {
                window.terminalSockets = {};
            }

            window.terminalSockets[terminalId] = socket;

            window.terminalSockets[uniqueTimestamp] = socket;
        }

        return () => {
        };
    }, [hostConfig]);

    useEffect(() => {
        const terminalContainer = terminalRef.current;
        if (!terminalContainer) return;

        const parentContainer = terminalContainer.parentElement;
        if (!parentContainer) return;

        const resizeObserver = new ResizeObserver(() => {
            if (terminalInstance.current && fitAddon.current) {
                resizeTerminal();
            }
        });

        resizeObserver.observe(parentContainer);

        const handleWindowResize = () => {
            if (terminalInstance.current && fitAddon.current) {
                resizeTerminal();
            }
        };

        window.addEventListener('resize', handleWindowResize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleWindowResize);
        };
    }, []);

    useEffect(() => {
        if (!terminalInstance.current || !hostConfig) return;

        const terminalId = `terminal-${hostConfig.ip.replace(/\./g, '-')}`;
        const terminalElement = terminalRef.current;

        if (terminalElement) {
            terminalElement.id = terminalId;
            terminalElement.classList.add('terminal-nerd-font');

            terminalElement.style.left = '2px';
            terminalElement.style.top = '2px';
            terminalElement.style.position = 'absolute';

            const styleElement = document.createElement('style');
            styleElement.innerHTML = `
                /* Font definition with specific metrics */
                @font-face {
                    font-family: 'Hack Nerd Font Mono';
                    src: local('Hack Nerd Font Mono'), local('Hack Nerd Font');
                    font-display: block;
                    font-style: normal;
                    font-weight: normal;
                }
                
                /* Fix Nerd Font character width - critical for column alignment */
                #${terminalId} .xterm-rows span {
                    font-family: 'Hack Nerd Font Mono', monospace !important;
                    font-variant-ligatures: none !important;
                    font-feature-settings: "liga" 0, "calt" 0, "dlig" 0 !important;
                    letter-spacing: 0 !important;
                    text-rendering: geometricPrecision !important;
                    font-kerning: none !important;
                    
                    /* Force monospace behavior */
                    -webkit-font-feature-settings: "tnum" on, "calt" 0, "liga" 0;
                    font-feature-settings: "tnum" on, "calt" 0, "liga" 0;
                    
                    /* Ensure characters are pixel-aligned */
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                
                /* Force terminal position */
                #${terminalId} {
                    position: absolute !important;
                    left: 2px !important;
                    top: 2px !important;
                    box-sizing: content-box !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                
                /* Fix canvas and screen positioning */
                #${terminalId} .xterm-screen {
                    margin: 0 !important;
                    padding: 0 !important;
                    position: absolute !important;
                    left: 0 !important;
                }
                
                #${terminalId} .xterm-screen canvas {
                    box-sizing: content-box !important;
                    left: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                
                /* Ensure container div is positioned properly */
                .terminal {
                    position: absolute !important;
                    left: 2px !important;
                    top: 2px !important;
                }
            `;
            document.head.appendChild(styleElement);

            setTimeout(() => {
                if (terminalInstance.current) {
                    const currentSize = terminalInstance.current.options.fontSize;
                    terminalInstance.current.options.fontSize = currentSize + 1;
                    setTimeout(() => {
                        if (terminalInstance.current) {
                            terminalInstance.current.options.fontSize = currentSize;
                            fitAddon.current.fit();

                            const { cols, rows } = terminalInstance.current;
                            if (socketRef.current && socketRef.current.connected) {
                                socketRef.current.emit("resize", { cols, rows });
                            }
                        }
                    }, 50);
                }
            }, 100);

            return () => {
                if (styleElement && document.head.contains(styleElement)) {
                    document.head.removeChild(styleElement);
                }
            };
        }
    }, [hostConfig, terminalInstance.current, terminalRef.current]);

    useEffect(() => {
        if (!terminalInstance.current || !terminalInstance.current._core) return;

        const originalCore = terminalInstance.current._core;

        if (originalCore && originalCore._renderService && originalCore._renderService._renderer) {
            const renderer = originalCore._renderService._renderer;

            const originalGetFont = renderer.getFont;
            const originalOnResize = originalCore._renderService.onResize;

            if (originalGetFont) {
                renderer.getFont = function() {
                    const currentFontSize = terminalInstance.current.options.fontSize;
                    const currentFontWeight = terminalInstance.current.options.fontWeight;
                    return `${currentFontWeight} ${currentFontSize}px 'Hack Nerd Font Mono', monospace`;
                };
            }

            if (originalOnResize) {
                originalCore._renderService.onResize = function(cols, rows) {
                    originalOnResize.call(this, cols, rows);

                    if (this._renderer && this._renderer.dimensions) {
                        const cellWidth = this._renderer.dimensions.actualCellWidth;
                        if (cellWidth) {
                            this._renderer.dimensions.actualCellWidth = Math.floor(cellWidth) + 0.01;
                        }
                    }
                };
            }
        }

        if (originalCore._charSizeService) {
            const originalMeasure = originalCore._charSizeService.measure;
            originalCore._charSizeService.measure = function(options, document) {
                const result = originalMeasure.call(this, options, document);

                if (result && result.width) {
                    result.width = Math.floor(result.width) + 0.02;
                }
                
                return result;
            };
        }
    }, [terminalInstance.current]);

    useEffect(() => {
        if (isVisible && terminalInstance.current && fitAddon.current) {
            setTimeout(() => {
                resizeTerminal();
            }, 50);
        }
    }, [isVisible]);

    const initialBgColor = hostConfig?.terminalConfig?.theme
        ? (terminalThemes[hostConfig.terminalConfig.theme]?.background || '#1e1e1e')
        : '#1e1e1e';

    const textColor = hostConfig?.terminalConfig?.theme
        ? (terminalThemes[hostConfig.terminalConfig.theme]?.foreground || '#f7f7f7')
        : '#f7f7f7';

    useEffect(() => {
        let originalFontSize = null;

        const handleLaunchpadOpen = () => {
            if (terminalInstance.current && originalFontSize === null) {
                originalFontSize = terminalInstance.current.options.fontSize;
            }
        };

        const handleLaunchpadClose = () => {
            if (terminalInstance.current && originalFontSize !== null) {
                terminalInstance.current.options.fontSize = originalFontSize;
                fitAddon.current.fit();
                originalFontSize = null;
            }
        };

        window.addEventListener('launchpad:open', handleLaunchpadOpen);
        window.addEventListener('launchpad:close', handleLaunchpadClose);

        return () => {
            window.removeEventListener('launchpad:open', handleLaunchpadOpen);
            window.removeEventListener('launchpad:close', handleLaunchpadClose);
        };
    }, []);

    useEffect(() => {
        if (isVisible && terminalInstance.current) {
            const currentFontSize = terminalInstance.current.options.fontSize;

            const lockFontSize = () => {
                if (terminalInstance.current) {
                    terminalInstance.current.options.fontSize = currentFontSize;
                }
            };

            const fontStabilizer = setInterval(lockFontSize, 20);

            setTimeout(() => clearInterval(fontStabilizer), 500);
            
            return () => clearInterval(fontStabilizer);
        }
    }, [isVisible]);

    useEffect(() => {
        if (terminalInstance.current) {
            let lastRefreshTime = 0;
            const REFRESH_INTERVAL = 16;
            
            const originalRefresh = terminalInstance.current.refresh;
            terminalInstance.current.refresh = function(start, end, immediate) {
                const now = Date.now();
                if (immediate || now - lastRefreshTime >= REFRESH_INTERVAL) {
                    lastRefreshTime = now;
                    return originalRefresh.call(this, start, end);
                }
            };
        }
    }, [terminalInstance.current]);

    useLayoutEffect(() => {
        if (!terminalInstance.current) return;

        const originalFontSize = terminalInstance.current.options.fontSize;
        let resizeTimeout;
        let isMounted = true;

        const freezeFontSize = () => {
            if (!isMounted || !terminalInstance.current) return;

            clearTimeout(resizeTimeout);

            terminalInstance.current.options.fontSize = originalFontSize;

            resizeTimeout = setTimeout(() => {
                if (isMounted && terminalInstance.current) {
                    terminalInstance.current.options.fontSize = originalFontSize;
                }
            }, 50);
        };

        const bodyObserver = new MutationObserver(() => {
            freezeFontSize();
        });

        bodyObserver.observe(document.body, { 
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        const handleResize = () => freezeFontSize();
        window.addEventListener('resize', handleResize);

        const handleModalEvents = () => freezeFontSize();
        window.addEventListener('dialog:open', handleModalEvents);
        window.addEventListener('modal:open', handleModalEvents);
        window.addEventListener('overlay:open', handleModalEvents);
        window.addEventListener('launchpad:open', handleModalEvents);

        freezeFontSize();
        
        return () => {
            isMounted = false;
            clearTimeout(resizeTimeout);
            bodyObserver.disconnect();
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('dialog:open', handleModalEvents);
            window.removeEventListener('modal:open', handleModalEvents);
            window.removeEventListener('overlay:open', handleModalEvents);
            window.removeEventListener('launchpad:open', handleModalEvents);
        };
    }, [terminalInstance.current]);

    useEffect(() => {
        if (!terminalInstance.current || !fitAddon.current) return;

        const originalFit = fitAddon.current.fit;

        fitAddon.current.fit = function() {
            const currentFontSize = terminalInstance.current.options.fontSize;

            originalFit.apply(this);

            terminalInstance.current.options.fontSize = currentFontSize;
        };
        
        return () => {
            if (fitAddon.current) {
                fitAddon.current.fit = originalFit;
            }
        };
    }, [terminalInstance.current, fitAddon.current]);

    useEffect(() => {
        if (!terminalInstance.current) return;

        let originalFontSize = terminalInstance.current.options.fontSize;
        let resizeTimer;

        if (isVisible) {
            const enforceFontSize = () => {
                if (terminalInstance.current) {
                    terminalInstance.current.options.fontSize = originalFontSize;
                }
            };

            enforceFontSize();

            for (let i = 0; i < 5; i++) {
                setTimeout(enforceFontSize, i * 50);
            }

            clearTimeout(resizeTimer);
        }
        
        return () => {
            clearTimeout(resizeTimer);
        };
    }, [isVisible, terminalInstance.current]);

    useEffect(() => {
        if (!terminalInstance.current) return;

        const originalSetOption = terminalInstance.current.setOption;

        terminalInstance.current.setOption = function(key, value) {
            if (key !== 'fontSize') {
                return originalSetOption.call(this, key, value);
            }

            const stack = new Error().stack || '';
            const isInternalCall = stack.includes('SSHTerminal') && 
                                  (stack.includes('freezeFontSize') || 
                                   stack.includes('enforceFontSize'));
            
            if (isInternalCall) {
                return originalSetOption.call(this, key, value);
            }
        };
        
        return () => {
            if (terminalInstance.current) {
                terminalInstance.current.setOption = originalSetOption;
            }
        };
    }, [terminalInstance.current]);

    useEffect(() => {
        if (!terminalInstance.current || !fitAddon.current) return;
        
        const fontSize = terminalInstance.current.options.fontSize;

        const stabilizeFontSize = () => {
            if (terminalInstance.current) {
                terminalInstance.current.options.fontSize = fontSize;

                if (terminalInstance.current._core) {
                    terminalInstance.current._core.renderer.clear();
                    terminalInstance.current.refresh(0, terminalInstance.current.rows - 1);
                }
            }
        };

        const stabilizationSchedule = [0, 10, 50, 100, 200, 500];
        const timeouts = [];
        
        for (const delay of stabilizationSchedule) {
            timeouts.push(setTimeout(stabilizeFontSize, delay));
        }
        
        return () => {
            for (const timeout of timeouts) {
                clearTimeout(timeout);
            }
        };
    }, [terminalInstance.current]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {showTitle && (
                <div
                    className="terminal-title px-3 py-1 font-medium text-sm flex-shrink-0"
                    style={{
                        backgroundColor: initialBgColor,
                        color: textColor,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        fontFamily: '"Hack Nerd Font", "Symbols Nerd Font", monospace',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        userSelect: 'none',
                        cursor: 'default'
                    }}
                    onMouseEnter={() => setShowConnectionInfo(true)}
                    onMouseLeave={() => setShowConnectionInfo(false)}
                    title={`${hostConfig.user}@${hostConfig.ip}:${hostConfig.port}`}
                >
                    <span style={{
                        marginRight: '6px',
                        opacity: 0.8,
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        lineHeight: 1
                    }}>
                        {'>'}
                    </span>
                    <span style={{
                        display: 'inline-block',
                        maxWidth: '90%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {showConnectionInfo
                            ? `${hostConfig.user}@${hostConfig.ip}:${hostConfig.port}`
                            : (title || hostConfig.name || hostConfig.ip)
                        }
                        <span style={{ marginLeft: '5px' }}></span>
                    </span>
                </div>
            )}
            <div
                className="flex-grow"
                style={{
                    backgroundColor: initialBgColor,
                    height: showTitle ? 'calc(100% - 26px)' : '100%',
                    position: 'relative'
                }}
                onClick={() => {
                    if (terminalInstance.current) {
                        terminalInstance.current.focus();
                    }
                }}
            >
                <div
                    ref={terminalRef}
                    className="terminal"
                    style={{
                        visibility: isVisible ? 'visible' : 'hidden',
                        backgroundColor: initialBgColor,
                        position: 'absolute',
                        width: 'calc(100% - 2px)',
                        height: 'calc(100% - 2px)',
                        top: '2px',
                        left: '2px',
                        margin: '0 !important',
                        padding: '0 !important',
                    }}
                />
            </div>
        </div>
    );
});

NewTerminal.displayName = "NewTerminal";

NewTerminal.propTypes = {
    hostConfig: PropTypes.shape({
        ip: PropTypes.string.isRequired,
        user: PropTypes.string.isRequired,
        password: PropTypes.string,
        sshKey: PropTypes.string,
        rsaKey: PropTypes.string,
        port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        terminalConfig: PropTypes.shape({
            theme: PropTypes.string,
            cursorStyle: PropTypes.string,
            fontFamily: PropTypes.string,
            fontSize: PropTypes.number,
            fontWeight: PropTypes.string,
            lineHeight: PropTypes.number,
            letterSpacing: PropTypes.number,
            cursorBlink: PropTypes.bool,
            sshAlgorithm: PropTypes.string
        })
    }).isRequired,
    isVisible: PropTypes.bool.isRequired,
    setIsNoAuthHidden: PropTypes.func.isRequired,
    setErrorMessage: PropTypes.func.isRequired,
    setIsErrorHidden: PropTypes.func.isRequired,
    title: PropTypes.string,
    showTitle: PropTypes.bool
};