/**
 * HomePage — Welcome screen shown when no collection is selected.
 */

function HomePage() {
    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="max-w-md space-y-4">
                <img
                    className="size-28 mx-auto"
                    src="/logo-2.png"
                    alt="Vaultrs"
                    loading="eager"
                />
                <h1 className="text-2xl font-bold text-foreground">
                    Welcome to Vaultrs
                </h1>
                <p className="text-muted-foreground">
                    Your personal metadata vault. Create a collection to start
                    organizing your data — films, games, books, or anything
                    else.
                </p>
                <div className="pt-4">
                    <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
                        + New Collection
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
