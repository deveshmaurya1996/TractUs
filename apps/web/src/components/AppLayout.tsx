"use client";

import {
  AppBar,
  Box,
  Chip,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { useOrganization } from "../app/providers";
import { usePathname, useRouter } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { selectedOrganization } = useOrganization();
  const pathname = usePathname();
  const router = useRouter();
  const isDetail = pathname.startsWith("/contracts/");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 2, minHeight: { xs: 56, sm: 64 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
            }}
            onClick={() => router.push("/")}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "primary.contrastText",
              }}
            >
              <DescriptionOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                Tract-Us
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                Contract Operations
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {selectedOrganization && (
            <Chip
              label={selectedOrganization.name}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}

          {isDetail && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Contract Detail
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
        {children}
      </Container>
    </Box>
  );
}
