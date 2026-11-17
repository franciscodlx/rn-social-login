import { createRef } from 'react';
import { Text } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import {
  approveWith,
  type NativeMock,
} from '../../../auth-core/src/__fixtures__/helpers';

jest.mock('../../../auth-core/src/NativeRnAuthCore', () => ({
  __esModule: true,
  default:
    require('../../../auth-core/src/__fixtures__/helpers').createNativeMock(),
}));

import NativeRnAuthCore from '../../../auth-core/src/NativeRnAuthCore';
import { LinkedInModal, type LinkedInModalRef } from '../index';

const native = NativeRnAuthCore as unknown as NativeMock;
const base = {
  clientID: '86abc',
  redirectUri: 'https://api.miapp.com/cb',
  callbackUri: 'miapp://callback',
};

let warn: jest.SpyInstance;
beforeEach(() => {
  native.openAuthSession.mockReset();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('LinkedInModal (compatibility layer)', () => {
  it('signs in from the default link and returns the authorization code', async () => {
    approveWith(native);
    const onSuccess = jest.fn();
    const onOpen = jest.fn();
    const onClose = jest.fn();
    await render(
      <LinkedInModal
        {...base}
        onSuccess={onSuccess}
        onOpen={onOpen}
        onClose={onClose}
      />
    );

    fireEvent.press(screen.getByText('Login with LinkedIn'));
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({
        authentication_code: 'the-code',
      })
    );
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('deprecated'));
  });

  it('opens through the ref with a custom button and custom permissions', async () => {
    approveWith(native);
    const ref = createRef<LinkedInModalRef>();
    const onSuccess = jest.fn();
    await render(
      <LinkedInModal
        {...base}
        ref={ref}
        permissions={['openid', 'email']}
        renderButton={() => <Text>Custom</Text>}
        onSuccess={onSuccess}
      />
    );
    expect(screen.getByText('Custom')).toBeTruthy();

    ref.current!.open();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(native.openAuthSession.mock.calls[0]![0]).toContain(
      'scope=openid%20email'
    );
    await expect(ref.current!.logoutAsync()).resolves.toBeUndefined();
  });

  it('reports provider errors with the old { type, message } shape', async () => {
    approveWith(native, {
      error: 'unauthorized_scope_error',
      error_description: 'Scope not authorized',
    });
    const onError = jest.fn();
    await render(
      <LinkedInModal {...base} onSuccess={jest.fn()} onError={onError} />
    );
    fireEvent.press(screen.getByText('Login with LinkedIn'));
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith({
        type: 'unauthorized_scope_error',
        message: 'Scope not authorized',
      })
    );
  });

  it('stays silent when the user cancels, and still calls onClose', async () => {
    approveWith(native, { error: 'user_cancelled_login' });
    const onError = jest.fn();
    const onClose = jest.fn();
    const onSuccess = jest.fn();
    await render(
      <LinkedInModal
        {...base}
        onSuccess={onSuccess}
        onError={onError}
        onClose={onClose}
      />
    );
    fireEvent.press(screen.getByText('Login with LinkedIn'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('never exchanges the code, even when given a client secret', async () => {
    approveWith(native);
    const fetchMock = jest.fn();
    (globalThis as { fetch: unknown }).fetch = fetchMock;
    const onSuccess = jest.fn();
    await render(
      <LinkedInModal
        {...base}
        clientSecret="secret"
        shouldGetAccessToken
        onSuccess={onSuccess}
      />
    );
    fireEvent.press(screen.getByText('Login with LinkedIn'));
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({
        authentication_code: 'the-code',
      })
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(native.openAuthSession.mock.calls[0]![0]).not.toContain('secret');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no longer supported')
    );
  });
});
