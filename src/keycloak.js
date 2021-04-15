import Keycloak from 'keycloak-js'

const keycloakConfig = {
    url: process.env.REACT_APP_KEYCLOAK_URL + '/auth',
    realm: 'direktiv',
    clientId: 'direktiv',
}

const keycloak = new Keycloak(keycloakConfig)

export default keycloak