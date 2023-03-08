export function getError(errorMessage) {
    switch (errorMessage) {
        case "duplicate key value violates unique constraint \"emailconfirmations_pkey\"":
            return {title: 'server.error.duplicate_confirmationkey_title', content:'server.error.duplicate_confirmationkey_content'};
        default:
            return {title: 'Error', content: errorMessage};
    }
}