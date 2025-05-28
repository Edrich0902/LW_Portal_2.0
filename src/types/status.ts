export enum Status {
    UNINITIALIZED = 'UNINITIALIZED',         // uninitialized

    UNAUTHENTICATED = 'UNAUTHENTICATED',     // 401 unauthenticated
    UNAUTHORIZED = 'UNAUTHORIZED',           // 403 unauthorized
    LOADING = 'LOADING',                     // loading data
    ERROR = 'ERROR',                         // general/unknown error
    DISCONNECTED = 'DISCONNECTED',           // no internet connection
    NOT_FOUND = 'NOT_FOUND',                 // 404 not found
    INVALID = 'INVALID',                     // 422 invalid (list query invalid or form submit invalid)
    OK = 'OK',                               // loading complete / waiting for user input

    // list
    EMPTY = 'EMPTY',                         // list is empty (list only)

    // form
    COMPLETE = 'COMPLETE',                   // save success (form only)
    DELETED = 'DELETED',                      // item is deleted

}