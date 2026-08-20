import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import Setup from '@/pages/auth/two-factor/Setup.vue';
import { requireElevatedSession } from '@/components/elevated-sessions';

vi.mock('@/components/elevated-sessions', () => ({
    requireElevatedSession: vi.fn(),
}));

window.__ = (key) => key;
window.Statamic = {
    $toast: {
        error: vi.fn(),
    },
};

const mountSetup = () => shallowMount(Setup, {
    props: {
        routes: {
            enable: '/cp/two-factor/enable',
            recovery_codes: {},
        },
        redirect: '/cp',
    },
    global: {
        stubs: {
            AuthCard: {
                template: '<div><slot /></div>',
            },
            Button: {
                template: '<button data-test="setup-button" @click="$emit(\'click\')"></button>',
            },
            Head: true,
            TwoFactorSetup: {
                template: '<div data-test="two-factor-setup"></div>',
            },
        },
    },
});

beforeEach(() => {
    vi.clearAllMocks();
});

test('it requires an elevated session before opening the enforced two factor setup', async () => {
    let elevate;
    requireElevatedSession.mockImplementation(() => new Promise((resolve) => {
        elevate = resolve;
    }));

    const wrapper = mountSetup();

    await wrapper.get('[data-test="setup-button"]').trigger('click');

    expect(requireElevatedSession).toHaveBeenCalledOnce();
    expect(wrapper.find('[data-test="two-factor-setup"]').exists()).toBe(false);

    elevate();
    await flushPromises();

    expect(wrapper.find('[data-test="two-factor-setup"]').exists()).toBe(true);
});

test('it keeps setup closed when the elevated session cannot be established', async () => {
    requireElevatedSession.mockRejectedValue(new Error('Elevation cancelled'));

    const wrapper = mountSetup();

    await wrapper.get('[data-test="setup-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-test="two-factor-setup"]').exists()).toBe(false);
    expect(Statamic.$toast.error).toHaveBeenCalledWith('statamic::messages.elevated_session_required');
});
