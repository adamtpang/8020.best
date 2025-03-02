import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Box,
    Divider
} from '@mui/material';
import { RestoreFromTrash, DeleteForever, DeleteSweep } from '@mui/icons-material';

const TrashDialog = ({ open, onClose, items = [], onRestore, onClear }) => {
    const [selectedItems, setSelectedItems] = React.useState([]);

    // Reset selected items when dialog opens
    React.useEffect(() => {
        if (open) {
            setSelectedItems([]);
        }
    }, [open]);

    const toggleItemSelection = (item) => {
        setSelectedItems((prev) =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        );
    };

    const handleRestore = () => {
        if (selectedItems.length > 0) {
            onRestore(selectedItems);
            setSelectedItems([]);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                Trash
            </DialogTitle>

            <DialogContent>
                {items.length === 0 ? (
                    <Typography variant="body1" sx={{ py: 2, textAlign: 'center' }}>
                        Trash is empty
                    </Typography>
                ) : (
                    <>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {items.length} deleted item{items.length !== 1 ? 's' : ''}
                            </Typography>
                            <Button
                                onClick={handleRestore}
                                startIcon={<RestoreFromTrash />}
                                disabled={selectedItems.length === 0}
                                size="small"
                            >
                                Restore Selected ({selectedItems.length})
                            </Button>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                            {items.map((item, index) => (
                                <ListItem
                                    key={index}
                                    button
                                    onClick={() => toggleItemSelection(item)}
                                    selected={selectedItems.includes(item)}
                                    dense
                                >
                                    <ListItemText
                                        primary={item}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label="restore"
                                            onClick={() => onRestore([item])}
                                            size="small"
                                        >
                                            <RestoreFromTrash fontSize="small" />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    Close
                </Button>
                {items.length > 0 && (
                    <Button
                        onClick={onClear}
                        color="error"
                        startIcon={<DeleteSweep />}
                    >
                        Clear Trash
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default TrashDialog;