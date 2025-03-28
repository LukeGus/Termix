import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import { Button } from '@mui/joy';
import HostViewerIcon from '../images/host_viewer_icon.png';
import theme from '../theme.js';
import HostViewer from './ssh/HostViewer.jsx';

function Launchpad({
    onClose,
    getHosts,
    connectToHost,
    isAddHostHidden,
    setIsAddHostHidden,
    isEditHostHidden,
    isErrorHidden,
    deleteHost,
    editHost,
    shareHost,
    userRef,
    isHostViewerMenuOpen,
    setIsHostViewerMenuOpen,
}) {
    const launchpadRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeApp, setActiveApp] = useState('hostViewer');
    const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                launchpadRef.current &&
                !launchpadRef.current.contains(event.target) &&
                isAddHostHidden &&
                isEditHostHidden &&
                isErrorHidden &&
                !isHostViewerMenuOpen &&
                !isAnyModalOpen
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose, isAddHostHidden, isEditHostHidden, isErrorHidden, isHostViewerMenuOpen, isAnyModalOpen]);

    const handleModalOpen = () => {
        setIsAnyModalOpen(true);
    };

    const handleModalClose = () => {
        setIsAnyModalOpen(false);
    };

    return (
        <CssVarsProvider theme={theme}>
            <div
                style={{
                    position: "fixed",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    zIndex: 1000,
                    backdropFilter: "blur(5px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    ref={launchpadRef}
                    style={{
                        width: "75%",
                        height: "75%",
                        backgroundColor: theme.palette.general.tertiary,
                        display: "flex",
                        borderRadius: "8px",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                        border: `1px solid ${theme.palette.general.secondary}`,
                        color: theme.palette.text.primary,
                        padding: 0,
                    }}
                >
                    {/* Sidebar */}
                    <div
                        style={{
                            width: sidebarOpen ? "200px" : "60px",
                            backgroundColor: theme.palette.general.disabled,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            padding: "10px 5px",
                            transition: "width 0.3s ease",
                            overflow: "hidden",
                            borderRight: `1px solid ${theme.palette.general.secondary}`,
                            borderTopLeftRadius: "8px",
                            borderBottomLeftRadius: "8px",
                        }}
                    >
                        {/* Sidebar Toggle Button */}
                        <Button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            sx={{
                                backgroundColor: theme.palette.general.primary,
                                '&:hover': {
                                    backgroundColor: theme.palette.general.dark,
                                },
                            }}
                            style={{
                                width: sidebarOpen ? "175px" : "40px",
                                height: "40px",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "10px",
                                transition: "width 0.3s ease",
                            }}
                        >
                            {sidebarOpen ? "←" : "→"}
                        </Button>

                        {/* HostViewer Button */}
                        <Button
                            onClick={() => setActiveApp('hostViewer')}
                            sx={{
                                backgroundColor: activeApp === 'hostViewer'
                                    ? theme.palette.general.tertiary
                                    : theme.palette.general.primary,
                                '&:hover': {
                                    backgroundColor: activeApp === 'hostViewer'
                                        ? theme.palette.general.tertiary
                                        : theme.palette.general.dark,
                                },
                            }}
                            style={{
                                width: sidebarOpen ? "175px" : "40px",
                                height: "40px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: "8px",
                                paddingLeft: sidebarOpen ? "15px" : "0",
                                transition: "width 0.3s ease",
                            }}
                        >
                            {sidebarOpen ? (
                                "Hosts"
                            ) : (
                                <img
                                    src={HostViewerIcon}
                                    alt="Host Viewer"
                                    width={24}
                                    height={24}
                                    style={{
                                        objectFit: "contain",
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                    }}
                                />
                            )}
                        </Button>
                    </div>

                    {/* Main Content */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {activeApp === 'hostViewer' && (
                            <HostViewer
                                getHosts={getHosts}
                                connectToHost={(hostConfig) => {
                                    if (!hostConfig || typeof hostConfig !== 'object') {
                                        return;
                                    }
                                    if (!hostConfig.ip || !hostConfig.user) {
                                        return;
                                    }
                                    connectToHost(hostConfig);
                                }}
                                setIsAddHostHidden={setIsAddHostHidden}
                                deleteHost={deleteHost}
                                editHost={editHost}
                                openEditPanel={editHost}
                                shareHost={shareHost}
                                onModalOpen={handleModalOpen}
                                onModalClose={handleModalClose}
                                userRef={userRef}
                                isMenuOpen={isHostViewerMenuOpen || false}
                                setIsMenuOpen={setIsHostViewerMenuOpen}
                            />
                        )}
                    </div>
                </div>
            </div>
        </CssVarsProvider>
    );
}

Launchpad.propTypes = {
    onClose: PropTypes.func.isRequired,
    getHosts: PropTypes.func.isRequired,
    connectToHost: PropTypes.func.isRequired,
    isAddHostHidden: PropTypes.bool.isRequired,
    setIsAddHostHidden: PropTypes.func.isRequired,
    isEditHostHidden: PropTypes.bool.isRequired,
    isErrorHidden: PropTypes.bool.isRequired,
    deleteHost: PropTypes.func.isRequired,
    editHost: PropTypes.func.isRequired,
    shareHost: PropTypes.func.isRequired,
    userRef: PropTypes.object.isRequired,
    isHostViewerMenuOpen: PropTypes.bool,
    setIsHostViewerMenuOpen: PropTypes.func.isRequired,
};

export default Launchpad;