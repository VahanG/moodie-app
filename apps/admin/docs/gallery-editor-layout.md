# Gallery editor layout

The Gallery workspace keeps the media grid and metadata editor as separate
desktop surfaces. The metadata editor is sticky and limited to the available
viewport height. If its form is taller than that space, the editor gets its own
vertical scrollbar instead of extending the entire Gallery page.

Scroll chaining is contained inside the editor at its boundaries, and stable
scrollbar space prevents the form width from shifting as overflow changes. On
narrow screens the editor remains above the grid while retaining its independent
scroll area.
