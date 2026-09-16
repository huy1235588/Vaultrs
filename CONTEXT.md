# Vaultrs

A personal metadata vault and structured, offline knowledge base for organizing custom collections of records at scale.

## Language

**Collection**:
The top-level organizational container representing a distinct type of user data with its own schema.
_Avoid_: Category, Table, Folder, Type

**Item**:
A single record or entity within a Collection.
_Avoid_: Row, Record, Document, Entry

**Attribute**:
A user-defined schema field definition belonging to a Collection specifying a name, key, and data type.
_Avoid_: Column, Custom Field, Field Definition, Property Definition

**Property**:
A concrete key-value entry stored on an Item adhering to an Attribute definition.
_Avoid_: Field Value, Cell, Attribute Value, Entry Data

**Item Reference**:
A directed reference from a source Item to a target Item within or across Collections via a reference Attribute.
_Avoid_: Foreign Key, Association, Edge, Cross-link

**Asset**:
A binary file (image, document, video) managed by Vaultrs with tracked metadata, hashes, and generated thumbnails.
_Avoid_: File, Blob, Media, Attachment

**Asset Role**:
The designated semantic display purpose of an Asset attached to an Item (e.g., cover, avatar, gallery).
_Avoid_: Asset Type, Attachment Slot, Tag

**Collection Settings**:
Persistent, collection-level schema configuration defining default presentation layout, media display roles, and browsing rules.
_Avoid_: Preferences, Collection Config, App Settings
