/**
 * PathwayMenuItem — the app's entry in the Apps dropdown.
 *
 * `closeOnAction: true` in MultiscalePathwayViewerApp.resources[] means the
 * dropdown closes on click — no handleClose needed.
 */
// Root-barrel import, NOT '@mui/material/Typography'. The share key is the
// exact string '@mui/material', and the federation plugin matches share keys
// exactly — a subpath import misses it and bundles MUI into this remote
// instead of taking the host's instance, giving you a second Emotion cache.
import { Typography } from '@mui/material'

import { useNetworkApi } from 'cyweb/NetworkApi'

const PathwayMenuItem = (): JSX.Element => {
  const networkApi = useNetworkApi()

  const handleClick = (): void => {
    networkApi.createNetworkFromEdgeList({
      name: 'Template Network',
      description: 'Created by the App Template menu action.',
      edgeList: [
        ['A', 'B'],
        ['B', 'C'],
        ['C', 'A'],
      ],
      addToWorkspace: true,
    })
  }

  return (
    <Typography
      sx={{
        px: 2,
        py: 1,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
      }}
      onClick={handleClick}
    >
      Create example network
    </Typography>
  )
}

export default PathwayMenuItem
