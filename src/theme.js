import { extendTheme } from '@mui/joy/styles';

const theme = extendTheme({
    colorSchemes: {
        light: {
            palette: {
                neutral: {
                    50: '#f7f7f7',
                    100: '#e1e1e1',
                    200: '#c4c4c4',
                    300: '#a7a7a7',
                    400: '#8a8a8a',
                    500: '#6e6e6e',
                    600: '#555555',
                    700: '#3d3d3d',
                    800: '#262626',
                    900: '#0f0f0f',
                },
                background: {
                    primary: '#3d3d3d',
                    terminal: '#262626',
                    paper: '#555555',
                },
                text: {
                    primary: '#f7f7f7',
                    secondary: '#a7a7a7',
                },
                general: {
                    primary: '#6e6e6e',
                    secondary: '#a7a7a7',
                    tertiary: '#3d3d3d',
                    disabled: '#262626',
                    dark: '#0f0f0f',
                }
            },
        },
    },
    typography: {
        fontFamily: 'Arial, sans-serif',
    },
});

export default theme;