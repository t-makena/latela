

## Remove Reports from Navigation

A single change to `src/components/layout/Navbar.tsx`: remove the "Reports" entry from the `navItems` array.

### Technical Details

In `src/components/layout/Navbar.tsx`, the `navItems` array currently includes:

```typescript
{ name: "Reports", href: "/reports", icon: FileText },
```

This line will be removed. The route in `App.tsx` and the `Reports.tsx` page file stay intact so the infrastructure remains available for future use -- it just won't be reachable from the sidebar.

The `FileText` import from `lucide-react` will also be removed since it's no longer used.

