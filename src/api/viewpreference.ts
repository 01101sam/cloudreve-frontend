/**
 * View preference related API interfaces and functions
 */

import { defaultOpts, send, ThunkResponse } from "./request";

export interface ViewPreference {
    layout?: string;
    show_thumb?: boolean;
    sort_by?: string;
    sort_direction?: string;
    page_size?: number;
    gallery_width?: number;
    list_columns?: string;
}

export interface ViewPreferenceRequest extends ViewPreference {
    path: string;
}

export function getViewPreference(path: string): ThunkResponse<ViewPreference> {
    return async (dispatch, _getState) => {
        return await dispatch(
            send(
                "/user/setting/view-preference",
                {
                    method: "POST",
                    data: { path }
                },
                {
                    ...defaultOpts,
                    bypassSnackbar: (_e) => true, // Silently fail
                }
            )
        );
    };
}

export function updateViewPreference(
    path: string,
    preferences: Partial<ViewPreference>
): ThunkResponse<void> {
    return async (dispatch, _getState) => {
        return await dispatch(
            send(
                "/user/setting/view-preference",
                {
                    method: "PUT",
                    data: {
                        path,
                        ...preferences
                    }
                },
                defaultOpts
            )
        );
    };
} 