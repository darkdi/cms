import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import axios from 'axios';
import Setup from '@/components/two-factor/Setup.vue';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

window.__ = (key) => key;
window.Statamic = {
    $toast: {
        error: vi.fn(),
    },
};

beforeEach(() => {
    vi.clearAllMocks();
});

test('it closes the setup modal and surfaces an enable request failure', async () => {
    axios.post.mockRejectedValue({
        message: 'Request failed with status code 403',
        response: {
            data: {
                message: 'Requires an elevated session.',
            },
        },
    });

    const wrapper = shallowMount(Setup, {
        props: {
            enableUrl: '/cp/two-factor/enable',
            recoveryCodeUrls: {},
        },
    });

    await flushPromises();

    expect(axios.post).toHaveBeenCalledWith('/cp/two-factor/enable');
    expect(Statamic.$toast.error).toHaveBeenCalledWith('Requires an elevated session.');
    expect(wrapper.emitted('close')).toHaveLength(1);
});
