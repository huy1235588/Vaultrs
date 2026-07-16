/**
 * MainLayout — Application shell with header, sidebar, and main content area.
 */

interface MainLayoutProps {
    children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className="flex w-64 flex-col border-r border-border bg-card">
                <div className="flex h-14 items-center gap-2 border-b border-border px-4">
                    <img
                        className="h-12"
                        src="/logo-1.png"
                        alt="Vaultrs"
                        loading="eager"
                    />
                </div>

                <nav className="flex-1 overflow-y-auto p-3">
                    <p className="px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Collections
                    </p>
                    <div className="mt-2 space-y-1">
                        <p className="px-2 py-1.5 text-sm text-muted-foreground">
                            No collections yet
                        </p>
                    </div>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Welcome
                    </h2>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </main>
        </div>
    );
}

export default MainLayout;
