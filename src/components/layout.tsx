import { Flex } from '@chakra-ui/react';
import NavBar from './navbar';
import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <Flex height="100vh" width="100vw" top="0">
      <NavBar />
      <Flex direction="column" flex="1" p="4" bg="gray.50" overflow="auto">
        {children}
      </Flex>
    </Flex>
  );
}