import { useState, useEffect, useRef } from "react";
import { NewTerminal } from "./apps/ssh/Terminal.jsx";
import { User } from "./apps/user/User.jsx";
import AddHostModal from "./modals/AddHostModal.jsx";
import AuthModal from "./modals/AuthModal.jsx";
import { Button } from "@mui/joy";
import { CssVarsProvider } from "@mui/joy";
import theme from "./theme";
import TabList from "./ui/TabList.jsx";
import Launchpad from "./apps/Launchpad.jsx";
import { Debounce } from './other/Utils.jsx';
import TermixIcon from "./images/termix_icon.png";
import RocketIcon from './images/launchpad_rocket.png';
import ProfileIcon from './images/profile_icon.png';
import ProfileModal from "./modals/ProfileModal.jsx";
import ErrorModal from "./modals/ErrorModal.jsx";
import EditHostModal from "./modals/EditHostModal.jsx";
import NoAuthenticationModal from "./modals/NoAuthenticationModal.jsx";
import eventBus from "./other/eventBus.jsx";

function App() {
    const [isAddHostHidden, setIsAddHostHidden] = useState(true);
    const [isAuthModalHidden, setIsAuthModalHidden] = useState(true);
    const [isProfileHidden, setIsProfileHidden] = useState(true);
    const [isErrorHidden, setIsErrorHidden] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [terminals, setTerminals] = useState([]);
    const userRef = useRef(null);
    const [activeTab, setActiveTab] = useState(null);
    const [nextId, setNextId] = useState(1);
    const [addHostForm, setAddHostForm] = useState({
        name: "",
        folder: "",
        ip: "",
        user: "",
        password: "",
        sshKey: "",
        port: 22,
        authMethod: "Select Auth",
        rememberHost: true,
        storePassword: true,
        connectionType: "ssh",
        rdpDomain: "",
        rdpWindowsAuthentication: true,
        rdpConsole: false,
        vncScaling: "100%",
        vncQuality: "High"
    });
    const [editHostForm, setEditHostForm] = useState({
        name: "",
        folder: "",
        ip: "",
        user: "",
        password: "",
        sshKey: "",
        port: 22,
        authMethod: "Select Auth",
        rememberHost: true,
        storePassword: true,
    });
    const [isNoAuthHidden, setIsNoAuthHidden] = useState(true);
    const [authForm, setAuthForm] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [noAuthenticationForm, setNoAuthenticationForm] = useState({
        authMethod: 'Select Auth',
        password: '',
        sshKey: '',
        keyType: '',
    })
    const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false);
    const [splitTabIds, setSplitTabIds] = useState([]);
    const [isEditHostHidden, setIsEditHostHidden] = useState(true);
    const [currentHostConfig, setCurrentHostConfig] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isHostViewerMenuOpen, setIsHostViewerMenuOpen] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === "l") {
                e.preventDefault();
                setIsLaunchpadOpen((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        terminals.forEach((terminal) => {
            if (
                (terminal.id === activeTab || splitTabIds.includes(terminal.id)) &&
                terminal.terminalRef?.resizeTerminal
            ) {
                terminal.terminalRef.resizeTerminal();
            }
        });
    }, [splitTabIds, activeTab, terminals]);

    useEffect(() => {
        const handleResize = Debounce(() => {
            terminals.forEach((terminal) => {
                if (
                    (terminal.id === activeTab || splitTabIds.includes(terminal.id)) &&
                    terminal.terminalRef?.resizeTerminal
                ) {
                    terminal.terminalRef.resizeTerminal();
                }
            });
        }, 100);

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [splitTabIds, activeTab, terminals]);

    useEffect(() => {
        terminals.forEach((terminal) => {
            if (
                (terminal.id === activeTab || splitTabIds.includes(terminal.id)) &&
                terminal.terminalRef?.resizeTerminal
            ) {
                terminal.terminalRef.resizeTerminal();
            }
        });
    }, [splitTabIds]);

    useEffect(() => {
        const sessionToken = localStorage.getItem('sessionToken');
        let isComponentMounted = true;
        let isLoginInProgress = false;

        if (userRef.current?.getUser()) {
            setIsLoggingIn(false);
            setIsAuthModalHidden(true);
            return;
        }

        if (!sessionToken) {
            setIsLoggingIn(false);
            setIsAuthModalHidden(false);
            return;
        }

        setIsLoggingIn(true);
        let loginAttempts = 0;
        const maxAttempts = 50;
        let attemptLoginInterval;

        const loginTimeout = setTimeout(() => {
            if (isComponentMounted) {
                clearInterval(attemptLoginInterval);
                if (!userRef.current?.getUser()) {
                    localStorage.removeItem('sessionToken');
                    setIsAuthModalHidden(false);
                    setIsLoggingIn(false);
                    setErrorMessage('Login timed out. Please try again.');
                    setIsErrorHidden(false);
                }
            }
        }, 10000);

        const attemptLogin = () => {
            if (!isComponentMounted || isLoginInProgress) return;

            if (loginAttempts >= maxAttempts || userRef.current?.getUser()) {
                clearTimeout(loginTimeout);
                clearInterval(attemptLoginInterval);

                if (!userRef.current?.getUser()) {
                    localStorage.removeItem('sessionToken');
                    setIsAuthModalHidden(false);
                    setIsLoggingIn(false);
                    setErrorMessage('Login timed out. Please try again.');
                    setIsErrorHidden(false);
                }
                return;
            }

            if (userRef.current) {
                isLoginInProgress = true;
                userRef.current.loginUser({
                    sessionToken,
                    onSuccess: () => {
                        if (isComponentMounted) {
                            clearTimeout(loginTimeout);
                            clearInterval(attemptLoginInterval);
                            setIsAuthModalHidden(true);
                            setIsLoggingIn(false);
                            setIsErrorHidden(true);
                        }
                        isLoginInProgress = false;
                    },
                    onFailure: (error) => {
                        if (isComponentMounted) {
                            if (!userRef.current?.getUser()) {
                                clearTimeout(loginTimeout);
                                clearInterval(attemptLoginInterval);
                                localStorage.removeItem('sessionToken');
                                setErrorMessage(`Auto-login failed: ${error}`);
                                setIsErrorHidden(false);
                                setIsAuthModalHidden(false);
                                setIsLoggingIn(false);
                            }
                        }
                        isLoginInProgress = false;
                    },
                });
            }
            loginAttempts++;
        };

        attemptLoginInterval = setInterval(attemptLogin, 100);
        attemptLogin();

        return () => {
            isComponentMounted = false;
            clearTimeout(loginTimeout);
            clearInterval(attemptLoginInterval);
        };
    }, []);

    const handleAddHost = () => {
        if (addHostForm.ip && addHostForm.port) {
            if (addHostForm.connectionType === 'ssh' && !addHostForm.user) {
                setErrorMessage("Please fill out all required fields (IP, User, Port).");
                setIsErrorHidden(false);
                return;
            }

            if (!addHostForm.rememberHost) {
                connectToHost();
                setIsAddHostHidden(true);
                return;
            }

            if (addHostForm.connectionType === 'ssh') {
                if (addHostForm.authMethod === 'Select Auth') {
                    setErrorMessage("Please select an authentication method.");
                    setIsErrorHidden(false);
                    return;
                }
                if (addHostForm.authMethod === 'password' && !addHostForm.password) {
                    setIsNoAuthHidden(false);
                    return;
                }
                if (addHostForm.authMethod === 'sshKey' && !addHostForm.sshKey) {
                    setIsNoAuthHidden(false);
                    return;
                }
            }
            else if (!addHostForm.password) {
                setIsNoAuthHidden(false);
                return;
            }

            try {
                connectToHost();
                if (!addHostForm.storePassword) {
                    addHostForm.password = '';
                }
                handleSaveHost();
                setIsAddHostHidden(true);
            } catch (error) {
                setErrorMessage(error.message || "Failed to add host");
                setIsErrorHidden(false);
            }
        } else {
            setErrorMessage("Please fill out all required fields.");
            setIsErrorHidden(false);
        }
    };

    const connectToHost = () => {
        const hostConfig = {
            name: addHostForm.name || '',
            folder: addHostForm.folder || '',
            ip: addHostForm.ip,
            user: addHostForm.user,
            port: String(addHostForm.port),
            password: addHostForm.rememberHost && addHostForm.authMethod === 'password' ? addHostForm.password : undefined,
            sshKey: addHostForm.rememberHost && addHostForm.authMethod === 'sshKey' ? addHostForm.sshKey : undefined,
        };

        const newTerminal = {
            id: nextId,
            title: hostConfig.name || hostConfig.ip,
            hostConfig,
            terminalRef: null,
        };
        setTerminals([...terminals, newTerminal]);
        setActiveTab(nextId);
        setNextId(nextId + 1);
        setIsAddHostHidden(true);
        setAddHostForm({ name: "", folder: "", ip: "", user: "", password: "", sshKey: "", port: 22, authMethod: "Select Auth", rememberHost: true, storePassword: true, connectionType: "ssh", rdpDomain: "", rdpWindowsAuthentication: true, rdpConsole: false, vncScaling: "100%", vncQuality: "High" });
    }

    const handleAuthSubmit = (form) => {
        try {
            setIsNoAuthHidden(true);

            setTimeout(() => {
                const updatedTerminals = terminals.map((terminal) => {
                    if (terminal.id === activeTab) {
                        return {
                            ...terminal,
                            hostConfig: {
                                ...terminal.hostConfig,
                                password: form.authMethod === 'password' ? form.password : undefined,
                                sshKey: form.authMethod === 'sshKey' ? form.sshKey : undefined
                            }
                        };
                    }
                    return terminal;
                });
                
                setTerminals(updatedTerminals);

                setNoAuthenticationForm({
                    authMethod: 'Select Auth',
                    password: '',
                    sshKey: '',
                    keyType: '',
                });
            }, 100);
        } catch (error) {
            console.error("Authentication error:", error);
            setErrorMessage("Failed to authenticate: " + (error.message || "Unknown error"));
            setIsErrorHidden(false);
        }
    };

    const connectToHostWithConfig = (hostConfig) => {
        if (!hostConfig || typeof hostConfig !== 'object') {
            return;
        }

        if (!hostConfig.ip || !hostConfig.user) {
            return;
        }

        const cleanHostConfig = {
            name: hostConfig.name || '',
            folder: hostConfig.folder || '',
            ip: hostConfig.ip.trim(),
            user: hostConfig.user.trim(),
            port: hostConfig.port || '22',
            password: hostConfig.password?.trim(),
            sshKey: hostConfig.sshKey?.trim(),
        };

        const newTerminal = {
            id: nextId,
            title: cleanHostConfig.name || cleanHostConfig.ip,
            hostConfig: cleanHostConfig,
            terminalRef: null,
        };
        setTerminals([...terminals, newTerminal]);
        setActiveTab(nextId);
        setNextId(nextId + 1);
        setIsLaunchpadOpen(false);
    }

    const handleSaveHost = async () => {
        try {
            let hostConfig = {
                name: addHostForm.name || addHostForm.ip,
                folder: addHostForm.folder,
                ip: addHostForm.ip,
                user: addHostForm.user,
                password: (addHostForm.authMethod === 'password' || addHostForm.connectionType === 'vnc' || addHostForm.connectionType === 'rdp') ? addHostForm.password : undefined,
                sshKey: addHostForm.connectionType === 'ssh' && addHostForm.authMethod === 'sshKey' ? addHostForm.sshKey : undefined,
                port: String(addHostForm.port),
                connectionType: addHostForm.connectionType,
                rdpDomain: addHostForm.connectionType === 'rdp' ? addHostForm.rdpDomain : undefined,
                rdpWindowsAuthentication: addHostForm.connectionType === 'rdp' ? addHostForm.rdpWindowsAuthentication : undefined,
                rdpConsole: addHostForm.connectionType === 'rdp' ? addHostForm.rdpConsole : undefined,
                vncScaling: addHostForm.connectionType === 'vnc' ? addHostForm.vncScaling : undefined,
                vncQuality: addHostForm.connectionType === 'vnc' ? addHostForm.vncQuality : undefined
            }
            if (userRef.current) {
                await userRef.current.saveHost({
                    hostConfig,
                });
            }
        } catch (error) {
            throw error;
        }
    }

    const handleLoginUser = ({ username, password, sessionToken, onSuccess, onFailure }) => {
        if (userRef.current) {
            if (sessionToken) {
                userRef.current.loginUser({
                    sessionToken,
                    onSuccess: () => {
                        setIsAuthModalHidden(true);
                        setIsLoggingIn(false);
                        if (onSuccess) onSuccess();
                    },
                    onFailure: (error) => {
                        localStorage.removeItem('sessionToken');
                        setIsAuthModalHidden(false);
                        setIsLoggingIn(false);
                        if (onFailure) onFailure(error);
                    },
                });
            } else {
                userRef.current.loginUser({
                    username,
                    password,
                    onSuccess: () => {
                        setIsAuthModalHidden(true);
                        setIsLoggingIn(false);
                        if (onSuccess) onSuccess();
                    },
                    onFailure: (error) => {
                        setIsAuthModalHidden(false);
                        setIsLoggingIn(false);
                        if (onFailure) onFailure(error);
                    },
                });
            }
        }
    };

    const handleGuestLogin = () => {
        if (userRef.current) {
            userRef.current.loginAsGuest();
        }
    }

    const handleCreateUser = ({ username, password, onSuccess, onFailure }) => {
        if (userRef.current) {
            userRef.current.createUser({
                username,
                password,
                onSuccess,
                onFailure,
            });
        }
    };

    const handleDeleteUser = ({ onSuccess, onFailure }) => {
        if (userRef.current) {
            userRef.current.deleteUser({
                onSuccess,
                onFailure,
            });
        }
    };

    const handleLogoutUser = () => {
        if (userRef.current) {
            userRef.current.logoutUser();
            window.location.reload();
        }
    };

    const getUser = () => {
        if (userRef.current) {
            return userRef.current.getUser();
        }
    }

    const getHosts = () => {
        if (userRef.current) {
            return userRef.current.getAllHosts();
        }
    }

    const deleteHost = (hostConfig) => {
        if (userRef.current) {
            userRef.current.deleteHost({
                hostId: hostConfig._id,
            });
        }
    };

    const updateEditHostForm = (hostConfig) => {
        if (hostConfig) {
            setCurrentHostConfig(hostConfig);
            setIsEditHostHidden(false);
        } else {
            console.error("hostConfig is null");
        }
    };

    const handleEditHost = async (oldConfig, newConfig = null) => {
        try {
            if (newConfig) {
                if (isEditing) return;
                setIsEditing(true);

                try {
                    await userRef.current.editHost({
                        oldHostConfig: oldConfig,
                        newHostConfig: newConfig,
                    });

                    await new Promise(resolve => setTimeout(resolve, 3000));
                    setIsEditHostHidden(true);
                } catch (error) {
                    throw error;
                } finally {
                    setIsEditing(false);
                }
                return;
            }

            updateEditHostForm(oldConfig);
        } catch (error) {
            console.error('Edit failed:', error);
            setErrorMessage(`Edit failed: ${error.message || error}`);
            setIsErrorHidden(false);
            setIsEditing(false);
        }
    };

    const closeTab = (id) => {
        const newTerminals = terminals.filter((t) => t.id !== id);
        setTerminals(newTerminals);
        if (activeTab === id) {
            setActiveTab(newTerminals[0]?.id || null);
        }
    };

    const toggleSplit = (id) => {
        if (splitTabIds.includes(id)) {
            setSplitTabIds((prev) => prev.filter((splitId) => splitId !== id));
            return;
        }

        if (splitTabIds.length >= 3) return;

        setSplitTabIds((prev) =>
            prev.includes(id) ? prev.filter((splitId) => splitId !== id) : [...prev, id]
        );
    };

    const handleSetActiveTab = (tabId) => {
        setActiveTab(tabId);
    };

    const getLayoutStyle = () => {
        if (splitTabIds.length === 1) {
            return "grid grid-cols-2 h-full gap-4";
        } else if (splitTabIds.length > 1) {
            return "grid grid-cols-2 grid-rows-2 gap-4 h-full overflow-hidden";
        }
        return "flex flex-col h-full gap-4";
    };

    return (
        <CssVarsProvider theme={theme}>
            <div className="flex h-screen bg-neutral-900 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Topbar */}
                    <div className="bg-neutral-800 text-white p-4 flex items-center justify-between gap-4 min-h-[75px] max-h-[75px] shadow-xl border-b-5 border-neutral-700">
                        <div className="bg-neutral-700 flex justify-center items-center gap-1 p-2 rounded-lg h-[52px]">
                            <img src={TermixIcon} alt="Termix Icon" className="w-[25px] h-[25px] object-contain" />
                            <h2 className="text-lg font-bold">Termix</h2>
                        </div>

                        <div className="flex-1 bg-neutral-700 rounded-lg overflow-hidden h-[52px] flex items-center">
                            <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-neutral-500 scrollbar-track-neutral-700 h-[52px] scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-h-1">
                                <TabList
                                    terminals={terminals}
                                    activeTab={activeTab}
                                    setActiveTab={handleSetActiveTab}
                                    closeTab={closeTab}
                                    toggleSplit={toggleSplit}
                                    splitTabIds={splitTabIds}
                                    theme={theme}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            {/* Launchpad Button */}
                            <Button
                                disabled={isLoggingIn || !userRef.current?.getUser()}
                                onClick={() => setIsLaunchpadOpen(true)}
                                sx={{
                                    backgroundColor: theme.palette.general.tertiary,
                                    "&:hover": { backgroundColor: theme.palette.general.secondary },
                                    flexShrink: 0,
                                    height: "52px",
                                    width: "52px",
                                    padding: 0,
                                    opacity: (!userRef.current?.getUser() || isLoggingIn) ? 0.3 : 1,
                                    cursor: (!userRef.current?.getUser() || isLoggingIn) ? 'not-allowed' : 'pointer',
                                    "&:disabled": {
                                        opacity: 0.3,
                                        backgroundColor: theme.palette.general.tertiary,
                                    }
                                }}
                            >
                                <img src={RocketIcon} alt="Launchpad" style={{ width: "70%", height: "70%", objectFit: "contain" }} />
                            </Button>

                            {/* Add Host Button */}
                            <Button
                                disabled={isLoggingIn || !userRef.current?.getUser()}
                                onClick={() => setIsAddHostHidden(false)}
                                sx={{
                                    backgroundColor: theme.palette.general.tertiary,
                                    "&:hover": { backgroundColor: theme.palette.general.secondary },
                                    flexShrink: 0,
                                    height: "52px",
                                    width: "52px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    padding: 0,
                                    opacity: (!userRef.current?.getUser() || isLoggingIn) ? 0.3 : 1,
                                    cursor: (!userRef.current?.getUser() || isLoggingIn) ? 'not-allowed' : 'pointer',
                                    "&:disabled": {
                                        opacity: 0.3,
                                        backgroundColor: theme.palette.general.tertiary,
                                    },
                                    fontSize: "4rem",
                                    fontWeight: "600",
                                    lineHeight: "0",
                                    paddingBottom: "8px",
                                }}
                            >
                                +
                            </Button>

                            {/* Profile Button */}
                            <Button
                                disabled={isLoggingIn}
                                onClick={() => userRef.current?.getUser() ? setIsProfileHidden(false) : setIsAuthModalHidden(false)}
                                sx={{
                                    backgroundColor: theme.palette.general.tertiary,
                                    "&:hover": { backgroundColor: theme.palette.general.secondary },
                                    flexShrink: 0,
                                    height: "52px",
                                    width: "52px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    padding: 0,
                                    opacity: isLoggingIn ? 0.3 : 1,
                                    cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                                    "&:disabled": {
                                        opacity: 0.3,
                                        backgroundColor: theme.palette.general.tertiary,
                                    }
                                }}
                            >
                                <img
                                    src={ProfileIcon}
                                    alt="Profile"
                                    style={{ width: "70%", height: "70%", objectFit: "contain" }}
                                />
                            </Button>
                        </div>
                    </div>

                    {/* Terminal Views */}
                    <div className={`relative p-4 terminal-container ${getLayoutStyle()}`}>
                        {userRef.current?.getUser() ? (
                            terminals.map((terminal) => (
                                <div
                                    key={terminal.id}
                                    className={`bg-neutral-800 rounded-lg overflow-hidden shadow-xl border-5 border-neutral-700 ${
                                        splitTabIds.includes(terminal.id) || activeTab === terminal.id ? "block" : "hidden"
                                    } flex-1`}
                                    style={{
                                        order: splitTabIds.includes(terminal.id)
                                            ? splitTabIds.indexOf(terminal.id)
                                            : 0,
                                    }}
                                >
                                    <NewTerminal
                                        key={terminal.id}
                                        hostConfig={terminal.hostConfig}
                                        isVisible={activeTab === terminal.id || splitTabIds.includes(terminal.id)}
                                        setIsNoAuthHidden={setIsNoAuthHidden}
                                        setErrorMessage={setErrorMessage}
                                        setIsErrorHidden={setIsErrorHidden}
                                        ref={(ref) => {
                                            terminal.terminalRef = ref;
                                        }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-neutral-400">
                                    <h2 className="text-2xl font-bold mb-4">Welcome to Termix</h2>
                                    <p>{isLoggingIn ? "Checking login status..." : "Please login to start managing your SSH connections"}</p>
                                </div>
                            </div>
                        )}
                        <NoAuthenticationModal
                            isHidden={isNoAuthHidden}
                            form={noAuthenticationForm}
                            setForm={setNoAuthenticationForm}
                            setIsNoAuthHidden={setIsNoAuthHidden}
                            handleAuthSubmit={handleAuthSubmit}
                        />
                    </div>

                    {/* Modals */}
                    {userRef.current?.getUser() && (
                        <>
                            <AddHostModal
                                isHidden={isAddHostHidden}
                                form={addHostForm}
                                setForm={setAddHostForm}
                                handleAddHost={handleAddHost}
                                setIsAddHostHidden={setIsAddHostHidden}
                            />
                            <EditHostModal
                                isHidden={isEditHostHidden}
                                form={editHostForm}
                                setForm={setEditHostForm}
                                handleEditHost={handleEditHost}
                                setIsEditHostHidden={setIsEditHostHidden}
                                hostConfig={currentHostConfig}
                            />
                            <ProfileModal
                                isHidden={isProfileHidden}
                                getUser={getUser}
                                handleDeleteUser={handleDeleteUser}
                                handleLogoutUser={handleLogoutUser}
                                setIsProfileHidden={setIsProfileHidden}
                            />
                            {isLaunchpadOpen && (
                                <Launchpad
                                    onClose={() => setIsLaunchpadOpen(false)}
                                    getHosts={getHosts}
                                    connectToHost={connectToHostWithConfig}
                                    isAddHostHidden={isAddHostHidden}
                                    setIsAddHostHidden={setIsAddHostHidden}
                                    isEditHostHidden={isEditHostHidden}
                                    isErrorHidden={isErrorHidden}
                                    deleteHost={deleteHost}
                                    editHost={handleEditHost}
                                    shareHost={(hostId, username) => userRef.current?.shareHost(hostId, username)}
                                    userRef={userRef}
                                    isHostViewerMenuOpen={isHostViewerMenuOpen}
                                    setIsHostViewerMenuOpen={setIsHostViewerMenuOpen}
                                />
                            )}
                        </>
                    )}

                    <ErrorModal
                        isHidden={isErrorHidden}
                        errorMessage={errorMessage}
                        setIsErrorHidden={setIsErrorHidden}
                    />

                    <AuthModal
                        isHidden={isAuthModalHidden}
                        form={authForm}
                        setForm={setAuthForm}
                        handleLoginUser={handleLoginUser}
                        handleCreateUser={handleCreateUser}
                        handleGuestLogin={handleGuestLogin}
                        setIsAuthModalHidden={setIsAuthModalHidden}
                    />

                    {/* User component */}
                    <User
                        ref={userRef}
                        onLoginSuccess={() => {
                            setIsAuthModalHidden(true);
                            setIsLoggingIn(false);
                            setIsErrorHidden(true);
                        }}
                        onCreateSuccess={() => {
                            setIsAuthModalHidden(true);
                            handleLoginUser({
                                username: authForm.username,
                                password: authForm.password,
                                onSuccess: () => {
                                    setIsAuthModalHidden(true);
                                    setIsLoggingIn(false);
                                    setIsErrorHidden(true);
                                },
                                onFailure: (error) => {
                                    setErrorMessage(`Login failed: ${error}`);
                                    setIsErrorHidden(false);
                                }
                            });
                        }}
                        onDeleteSuccess={() => {
                            setIsProfileHidden(true);
                            window.location.reload();
                        }}
                        onFailure={(error) => {
                            setErrorMessage(`Action failed: ${error}`);
                            setIsErrorHidden(false);
                            setIsLoggingIn(false);
                            eventBus.emit('failedLoginUser');
                        }}
                    />
                </div>
            </div>
        </CssVarsProvider>
    );
}

export default App;