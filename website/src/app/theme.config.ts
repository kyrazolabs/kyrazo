import { $t } from '@primeuix/themes';

/**
 * Shared Noir preset extension for PrimeNG
 */
export const getNoirSemantic = () => {
    return {
        primary: {
            50: '{surface.50}',
            100: '{surface.100}',
            200: '{surface.200}',
            300: '{surface.300}',
            400: '{surface.400}',
            500: '{surface.500}',
            600: '{surface.600}',
            700: '{surface.700}',
            800: '{surface.800}',
            900: '{surface.900}',
            950: '{surface.950}',
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.950}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.800}',
                    activeColor: '{primary.700}',
                },
                highlight: {
                    background: '{primary.950}',
                    focusBackground: '{primary.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff',
                },
            },
            dark: {
                primary: {
                    color: '{primary.50}',
                    contrastColor: '{primary.950}',
                    hoverColor: '{primary.200}',
                    activeColor: '{primary.300}',
                },
                highlight: {
                    background: '{primary.50}',
                    focusBackground: '{primary.300}',
                    color: '{primary.950}',
                    focusColor: '{primary.950}',
                },
            },
        },
    };
};

export const getNoirPreset = () => {
    return {
        semantic: getNoirSemantic(),
    };
};

export const getPrimarySemantic = () => {
    return {
        primary: {
            50: '{primary.50}',
            100: '{primary.100}',
            200: '{primary.200}',
            300: '{primary.300}',
            400: '{primary.400}',
            500: '{primary.500}',
            600: '{primary.600}',
            700: '{primary.700}',
            800: '{primary.800}',
            900: '{primary.900}',
            950: '{primary.950}',
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.500}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.600}',
                    activeColor: '{primary.700}',
                },
                highlight: {
                    background: '{primary.50}',
                    focusBackground: '{primary.100}',
                    color: '{primary.700}',
                    focusColor: '{primary.800}',
                },
            },
            dark: {
                primary: {
                    color: '{primary.400}',
                    contrastColor: '{surface.900}',
                    hoverColor: '{primary.300}',
                    activeColor: '{primary.200}',
                },
                highlight: {
                    background:
                        'color-mix(in srgb, {primary.400}, transparent 84%)',
                    focusBackground:
                        'color-mix(in srgb, {primary.400}, transparent 76%)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)',
                },
            },
        },
    };
};

export const getPrimaryPreset = () => {
    return {
        semantic: getPrimarySemantic(),
    };
};

export const indigo = {
    50: 'oklch(96.2% 0.018 272.314)',
    100: 'oklch(93% 0.034 272.788)',
    200: 'oklch(87% 0.065 274.039)',
    300: 'oklch(78.5% 0.115 274.713)',
    400: 'oklch(67.3% 0.182 276.935)',
    500: 'oklch(58.5% 0.233 277.117)',
    600: 'oklch(51.1% 0.262 276.966)',
    700: 'oklch(45.7% 0.24 277.023)',
    800: 'oklch(39.8% 0.195 277.366)',
    900: 'oklch(35.9% 0.144 278.697)',
    950: 'oklch(25.7% 0.09 281.288)',
};

export const getIndigoPreset = () => {
    return {
        semantic: {
            primary: indigo,
            colorScheme: {
                light: {
                    primary: {
                        color: '{primary.500}',
                        contrastColor: '#ffffff',
                        hoverColor: '{primary.600}',
                        activeColor: '{primary.700}',
                    },
                    highlight: {
                        background: '{primary.50}',
                        focusBackground: '{primary.100}',
                        color: '{primary.700}',
                        focusColor: '{primary.800}',
                    },
                },
                dark: {
                    primary: {
                        color: '{primary.400}',
                        contrastColor: '{surface.900}',
                        hoverColor: '{primary.300}',
                        activeColor: '{primary.200}',
                    },
                    highlight: {
                        background:
                            'color-mix(in srgb, {primary.400}, transparent 84%)',
                        focusBackground:
                            'color-mix(in srgb, {primary.400}, transparent 76%)',
                        color: 'rgba(255,255,255,.87)',
                        focusColor: 'rgba(255,255,255,.87)',
                    },
                },
            },
        },
    };
};
