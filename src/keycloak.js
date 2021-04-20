import Keycloak from 'keycloak-js'

let url = window.__PUBLIC_KEYCLOAK_URL__

if(process.env.REACT_APP_KEYCLOAK_URL) {
    url = process.env.REACT_APP_KEYCLOAK_URL
}


const keycloakConfig = {
    url: url + '/auth',
    realm: 'direktiv',
    clientId: 'direktiv',
}

const keycloak = new Keycloak(keycloakConfig)

export default keycloak