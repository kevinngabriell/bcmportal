import { EmptyStateContent, EmptyStateDescription, EmptyStateIndicator, EmptyStateRoot, EmptyStateTitle, VStack } from "@chakra-ui/react";
import { BiError } from "react-icons/bi";

function EmptyState(){
    return(
        <EmptyStateRoot>
            <EmptyStateContent>
                <EmptyStateIndicator>
                    <BiError/>
                </EmptyStateIndicator>
                <VStack textAlign="center">
                    <EmptyStateTitle>Hold On, We’re Building This Page</EmptyStateTitle>
                    <EmptyStateDescription>This page is still under construction. If you need this feature urgently, please contact the development team.</EmptyStateDescription>
                </VStack>
            </EmptyStateContent>
        </EmptyStateRoot>
    );
}

export default EmptyState;