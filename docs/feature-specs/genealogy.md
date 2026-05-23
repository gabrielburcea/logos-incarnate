# Feature Spec: Genealogy Explorer

## Summary

Genealogy Explorer helps users trace biblical people through lineage, tribes, descendants, and nations.

## Goals

- make biblical family relationships easier to understand
- connect people to Scripture passages and historical context
- provide a visually navigable lineage view

## Core Features

### Person Search
- search for a biblical person
- open their genealogy profile

### Relationship View
Show relationships such as:
- father
- mother
- son
- daughter
- spouse
- tribe
- nation
- descendant line

### Scripture References
- each relationship should be traceable to supporting biblical references where available

## Visualization
The first version may use:
- simple tree layout
- expandable family branches
- linked profile cards

Later versions may use:
- graph view
- timeline overlays
- nation migration layers

## Data Requirements

### Entities
- Person
- Relationship
- Nation
- Tribe
- ScriptureReference

### Relationship Types
- parent_of
- child_of
- spouse_of
- member_of_tribe
- member_of_nation
- ancestor_of
- descendant_of

## Acceptance Criteria

- user can search supported people
- user can open a lineage profile
- user can view at least core father/descendant chains
- user can navigate between related persons
- user can see supporting Scripture references
