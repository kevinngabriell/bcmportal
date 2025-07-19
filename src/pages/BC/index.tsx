import { Container } from "@chakra-ui/react";
import EmptyState from "../../components/emptystate";
import Layout from "../../components/layout";

function BC(){
    return(
        <Layout>
            <Container height="100vh" display="flex" alignItems="center" justifyContent="center">
                <EmptyState/>
            </Container>
        </Layout>
    );
}

export default BC;