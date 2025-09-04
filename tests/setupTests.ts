// tests/setupTests.ts
import { config } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';

// PrimeVue components your app uses in tests
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import AutoComplete from 'primevue/autocomplete';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';

// Install PrimeVue plugin with a minimal config so $primevue.config exists
config.global.plugins = [
    [PrimeVue, { ripple: false, unstyled: true, pt: {} }],
];

// Register the tooltip directive (NamedInput uses v-tooltip)
config.global.directives = {
    tooltip: Tooltip,
};

// Optionally register commonly used components globally
config.global.components = {
    InputText,
    InputNumber,
    Select,
    AutoComplete,
    Textarea,
    Checkbox,
};

// (Optional) If something still tries to read $primevue early, you can also ensure:
(config.global.config as any) = {
    globalProperties: {
        $primevue: { config: { ripple: false, unstyled: true, pt: {} } },
    },
};