import { authenticate } from "../shopify.server";

export async function loader({request, params}) {
    const {admin} = await authenticate.admin(request) // if the user is authenticated, then the method returns an admin object if not, then it handles the necessasry redirects
    
}