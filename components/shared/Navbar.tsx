import React from "react";
import Header from "./Header";
import { NavTab } from "./Sidebar";

interface NavbarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath = "/citizen", onNavigate }) => {
  const activeTab: NavTab = currentPath === "/dashboard" ? "overview" : "citizen";

  const handleSelectTab = (tab: NavTab) => {
    if (onNavigate) {
      onNavigate(tab === "citizen" ? "/citizen" : "/dashboard");
    }
  };

  return (
    <Header
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
    />
  );
};

export default Navbar;
