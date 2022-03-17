/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError, InteractionRequiredAuthError } from "@azure/msal-common";
import { BrowserAuthError } from "./BrowserAuthError";

export type OSError = {
    error: number;
    protocol_error: string;
    properties: object;
    status: string;
    retryable?: boolean;
};

export enum NativeStatusCode {
    USER_INTERACTION_REQUIRED = "USER_INTERACTION_REQUIRED",
    USER_CANCEL = "USER_CANCEL",
    NO_NETWORK = "NO_NETWORK",
    TRANSIENT_ERROR = "TRANSIENT_ERROR",
    PERSISTENT_ERROR = "PERSISTENT_ERROR", 
}

export const NativeAuthErrorMessage = {
    extensionError: {
        code: "ContentError"
    }
};

export class NativeAuthError extends AuthError {
    ext: OSError | undefined;

    constructor(errorCode: string, description: string, ext?: OSError) {
        super(errorCode, description);

        Object.setPrototypeOf(this, NativeAuthError.prototype);
        this.name = "NativeAuthError";
        this.ext = ext;
    }

    /**
     * These errors should result in a fallback to the 'standard' browser based auth flow.
     */
    isFatal(): boolean {
        if (this.ext && this.ext.status && this.ext.status === NativeStatusCode.PERSISTENT_ERROR) {
            return true;
        }
        
        switch (this.errorCode) {
            case NativeAuthErrorMessage.extensionError.code:
                return true;
            default:
                return false;
        }
    }

    /**
     * Create the appropriate error object based on the WAM status code.
     * @param code 
     * @param description 
     * @param ext 
     * @returns 
     */
    static createError(code: string, description: string, ext?: OSError): AuthError {
        if (ext && ext.status) {
            switch (ext.status) {
                case NativeStatusCode.USER_INTERACTION_REQUIRED:
                    return new InteractionRequiredAuthError(code, description);
                case NativeStatusCode.USER_CANCEL:
                    return BrowserAuthError.createUserCancelledError();
                case NativeStatusCode.NO_NETWORK:
                    return BrowserAuthError.createNoNetworkConnectivityError();
            }
        }

        return new NativeAuthError(code, description, ext);
    }
}