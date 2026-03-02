// Command Palette - Global command palette using cmdk

import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command';
import {
    Plus,
    FolderOpen,
    Search,
    Settings2,
    LayoutList,
    LayoutGrid,
    PanelLeftClose,
    Sun,
    Moon,
    Monitor,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useVaultStore } from '@/modules/vault';

export function CommandPalette() {
    const {
        commandPaletteOpen,
        setCommandPaletteOpen,
        setShowCreateVault,
        setShowCreateEntry,
        setShowFieldManager,
        setViewMode,
        toggleSidebar,
        setTheme,
    } = useUIStore();

    const { vaults, setActiveVault } = useVaultStore();

    const runCommand = (command: () => void) => {
        setCommandPaletteOpen(false);
        command();
    };

    return (
        <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                {/* Navigation */}
                {vaults.length > 0 && (
                    <>
                        <CommandGroup heading="Navigation">
                            {vaults.map((vault) => (
                                <CommandItem
                                    key={vault.id}
                                    onSelect={() => runCommand(() => setActiveVault(vault.id))}
                                >
                                    <FolderOpen className="h-4 w-4" />
                                    <span>{vault.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Create */}
                <CommandGroup heading="Create">
                    <CommandItem onSelect={() => runCommand(() => setShowCreateVault(true))}>
                        <Plus className="h-4 w-4" />
                        <span>New Vault</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setShowCreateEntry(true))}>
                        <Plus className="h-4 w-4" />
                        <span>New Entry</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />

                {/* Actions */}
                <CommandGroup heading="Actions">
                    <CommandItem onSelect={() => runCommand(() => setShowFieldManager(true))}>
                        <Settings2 className="h-4 w-4" />
                        <span>Manage Fields</span>
                    </CommandItem>
                    <CommandItem onSelect={() => setCommandPaletteOpen(false)}>
                        <Search className="h-4 w-4" />
                        <span>Search Entries</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />

                {/* View */}
                <CommandGroup heading="View">
                    <CommandItem onSelect={() => runCommand(() => setViewMode('list'))}>
                        <LayoutList className="h-4 w-4" />
                        <span>List View</span>
                        <CommandShortcut>Ctrl+1</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setViewMode('grid'))}>
                        <LayoutGrid className="h-4 w-4" />
                        <span>Grid View</span>
                        <CommandShortcut>Ctrl+2</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => toggleSidebar())}>
                        <PanelLeftClose className="h-4 w-4" />
                        <span>Toggle Sidebar</span>
                        <CommandShortcut>Ctrl+B</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />

                {/* Theme */}
                <CommandGroup heading="Theme">
                    <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                        <Sun className="h-4 w-4" />
                        <span>Light Mode</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                        <Moon className="h-4 w-4" />
                        <span>Dark Mode</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
                        <Monitor className="h-4 w-4" />
                        <span>System Theme</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
