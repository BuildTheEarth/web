"use server"

import { AppShellNavbar, Divider, Stack } from "@mantine/core";

import { navLinks } from "@/util/links";
import NavLink from "./NavLink";

export interface Navbar {
  displayProtected?: boolean;
}

/**
 * Main Navbar
 */
export default async function Navbar(props: Navbar) {
  
  const allowedLinks = navLinks.filter((link) => props.displayProtected || !link.protected);

  const links = allowedLinks.map((item) =>
    item.divider ? (
      <Divider key={item.label} label={item.label} labelPosition="left" />
    ) : (
      <NavLink key={item.label} {...item} />
    )
  );

  return (
    <AppShellNavbar p="md">
      <Stack gap="xs">
        {links}
      </Stack>
    </AppShellNavbar>
  );    
}
