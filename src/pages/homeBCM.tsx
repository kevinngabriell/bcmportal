import { Text } from "@chakra-ui/react";
import Layout from "../components/layout";

function HomeBCM(){
    return(
        <Layout>
            <Text fontWeight="bold" fontSize="1.5rem" color="black" marginBottom={"40px"}>Business Continuity Management</Text>
            {/* <Row>
                <Col flex="1 1 200px"></Col>
                <Col flex="0 1 700px"><BCMCalendar/></Col>
            </Row>  */}
        </Layout>
    );
}

export default HomeBCM;