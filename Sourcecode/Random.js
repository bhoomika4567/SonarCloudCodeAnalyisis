/* eslint-disable react/display-name */
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';
import { Dialog } from '@ui5/webcomponents-react';
import { updateOpenAPISpec } from '../../../services/ActionService';
import { getIsUploadAllowed, isEditingEnabled } from '../../../utils/ActionUtils';
import showToast from '../../components-core/toast/showToast';
import { hideBusyIndicator, showBusyIndicator } from '../../components-core/busyIndicator/busyIndicator';
import './UpdateSpecDialog.module.css';
import { localizeStrings } from '../../../i18n/i18n';
import { getProjectID } from '../../../feature/QueryManager/QueryManager';
import { UserContext } from '../../../context/UserContext';
import { ProjectMetadataContext } from '../../../context/ProjectMetadataContext';

export const UpdateSpecDialog2 = forwardRef((props, ref) => {
	let additionalData = undefined;
	const [isDialogOpen, setDialogOpen] = useState(false);
	const { projectMetadata } = useContext(ProjectMetadataContext);
	useImperativeHandle(ref, () => ({
		open: () => setDialogOpen(true),
		close: () => setDialogOpen(false),
	}));
	const { isUserDetailsLoading, userData } = useContext(UserContext);
	// check privileges for operations
	const isUploadAllowed = getIsUploadAllowed(isUserDetailsLoading, userData, projectMetadata.globalSettings?.apiSource);
	const editingEnabled = isEditingEnabled();

	const updateProjectWithNewSpec = async (event) => {
		setDialogOpen(false);
		const file = event.detail.data.files;
		const additionalProperties = JSON.stringify(event.detail.data.additionalProperties);
		await updateSpec(editingEnabled, isUploadAllowed, file, additionalProperties);
	};

	const onCancelClicked = () => {
		setDialogOpen(false);
	};

	if (userData.category) {
		additionalData = JSON.stringify({
			userPref: userData.category['build.preferences'],
		});
	}
	useEffect(() => {
		document.addEventListener('studio-next-click', updateProjectWithNewSpec);
		document.addEventListener('studio-cancel-click', onCancelClicked);
		return () => {
			document.removeEventListener('studio-next-click', updateProjectWithNewSpec);
			document.removeEventListener('studio-cancel-click', onCancelClicked);
		};
	}, []);

	return (
		<Dialog
			data-testId="upload-spec-dialog-2"
			id="update-flow-dialog"
			accessibleName={localizeStrings('UPDATE_OPEN_API.FILE_UPLOADER.TEXT')}
			open={isDialogOpen}
			style={{ width: '1245px', height: '767px' }}
			onBeforeClose={(event) => {
				if (event.detail.escPressed) {
					onCancelClicked();
				}
			}}
		>
			{
				isDialogOpen ? <sap-build-action-create is-events update-flow screen-to-display={undefined} screen-data={undefined} additional-data={additionalData}/> : <></>
			}
		</Dialog>
	);
});

async function updateSpec(editingEnabled: boolean, isUploadAllowed: boolean, file: any, additionalProperties: string) {
	if (!editingEnabled || !isUploadAllowed) {
		return;
	}
	showBusyIndicator();
	try {
		const projectId = getProjectID();
		const response = await updateOpenAPISpec(projectId, file, additionalProperties);
		showToast(response);
		sessionStorage.removeItem('destination_name');
		window.location.reload(); // reload page
	} catch (err) {
		showToast(localizeStrings('UPDATE_OPEN_API.UPDATE_FAILED_WARNING.TEXT'));
	} finally {
		hideBusyIndicator();
	}
}

export const updateSpecDialogExportedForTesting = {
	updateSpec,
	UpdateSpecDialog2,
};
