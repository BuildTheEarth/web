'use client';

import { adminUserBatchAction } from '@/actions/user';
import { Button, FileInput, Paper, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type InputFormat = 'json' | 'csv' | 'txt';

export function BatchUploadStepOne() {
	const [format, setFormat] = useState<InputFormat>('json');
	const [file, setFile] = useState<File | null>(null);
	const [jsonPath, setJsonPath] = useState('');
	const [jsonIdKey, setJsonIdKey] = useState('');
	const [csvColumn, setCsvColumn] = useState('');
	const rouer = useRouter();

	const handlePrepareData = () => {
		const out: string[] = [];

		if (!file) return;
		if (format === 'csv' && !csvColumn) return;

		if (format === 'json') {
			// read raw text first to avoid JS numeric precision loss for large unquoted IDs
			const reader = new FileReader();
			reader.onload = (e) => {
				const text = e.target?.result as string;
				// If user provided an ID key, try to extract unquoted numeric IDs directly from the raw text
				if (jsonIdKey) {
					const unquotedRegex = new RegExp(`"${jsonIdKey}"\\s*:\\s*(\\d{6,})`, 'g');
					const rawMatches = Array.from(text.matchAll(unquotedRegex));
					if (rawMatches.length > 0) {
						for (const m of rawMatches) {
							out.push(m[1]);
						}
						console.log('Extracted IDs from raw JSON text (unquoted numbers):', out.length, 'items');
						finish();
						return;
					}
				}
				// Fallback to safe JSON.parse and extract IDs (works when IDs are quoted or not too large)
				try {
					const json = JSON.parse(text);
					const arr = jsonPath ? jsonPath.split('.').reduce((obj, key) => obj?.[key], json) : json;
					if (Array.isArray(arr)) {
						console.log('Extracted array from JSON:', arr.length, 'items');
						for (const item of arr) {
							if (jsonIdKey) {
								if (jsonIdKey in item) {
									out.push(String(item[jsonIdKey]));
								} else {
									alert(`ID key "${jsonIdKey}" not found in some items. Please check your JSON ID key.`);
									return;
								}
							} else {
								// item itself may be primitive
								out.push(String(item));
							}
						}
					} else {
						alert('The specified JSON path does not lead to an array.');
						return;
					}
					finish();
				} catch (err) {
					alert('Failed to parse JSON file. Please check the file format and try again.');
				}
			};
			reader.readAsText(file);
		} else if (format === 'csv') {
			// parse CSV and extract IDs based on csvColumn
			const reader = new FileReader();
			reader.onload = (e) => {
				const text = e.target?.result as string;
				const lines = text
					.split('\n')
					.map((line) => line.trim())
					.filter((line) => line);
				const headers = lines[0].split(',').map((h) => h.trim());
				const colIndex = headers.indexOf(csvColumn);
				if (colIndex === -1) {
					alert(`Column "${csvColumn}" not found in CSV headers. Please check your CSV column name.`);
					return;
				}
				for (let i = 1; i < lines.length; i++) {
					const cols = lines[i].split(',').map((c) => c.trim());
					if (colIndex < cols.length) {
						out.push(cols[colIndex]);
					} else {
						alert(`Line ${i + 1} does not have enough columns. Please check your CSV file.`);
						return;
					}
				}
				console.log('Extracted IDs from CSV:', out.length, 'items');
				finish();
			};
			reader.readAsText(file);
		} else if (format === 'txt') {
			const reader = new FileReader();
			reader.onload = (e) => {
				const text = e.target?.result as string;
				console.log('Raw text content loaded:', text.length, 'characters');
				const lines = text
					.split('\n')
					.map((line) => line.trim())
					.filter((line) => line);
				out.push(...lines);
				console.log('Extracted IDs from TXT:', out.length, 'items');
				finish();
			};
			reader.readAsText(file);
		}

		const finish = () => {
			if (out.length === 0) {
				alert('No valid IDs found in the file. Please check the file content and format.');
				return;
			}
			if (out.length > 1000) {
				alert(
					'Please limit the input file to 200 entries to avoid performance issues. Detected entries: ' + out.length,
				);
				return;
			}
			adminUserBatchAction(null, { step: 'load', data: out }).then((res) => {
				console.log(res);
				if (res.status === 'success') {
					alert(`Data prepared successfully. ${out.length} items loaded.`);
					rouer.push('?step=2');
				} else {
					alert(`Error preparing data: ${res.error}`);
				}
			});
		};
	};

	return (
		<Paper withBorder p="lg" radius="md">
			<Stack gap="md">
				<Stack gap={4}>
					<Text fw={600}>Step 1: Upload source data</Text>
					<Text c="dimmed" size="sm">
						Upload a CSV or JSON file with SSO IDs or Discord IDs. For JSON, you can point at an array nested under a
						key and choose the property that contains the ID. For CSV, choose the column to read.
					</Text>
				</Stack>

				<FileInput
					label="Input Data"
					placeholder="data.json"
					accept="application/json,text/csv,text/plain"
					value={file}
					onChange={(e) => {
						setFile(e);
						if (e) {
							const ext = e.name.split('.').pop()?.toLowerCase();
							if (ext === 'json') {
								setFormat('json');
							} else if (ext === 'csv') {
								setFormat('csv');
							} else if (ext === 'txt') {
								setFormat('txt');
							}
						} else {
							setFormat('json');
						}
					}}
				/>

				<SegmentedControl
					value={format}
					disabled
					onChange={(value) => setFormat(value as InputFormat)}
					data={[
						{ label: 'JSON', value: 'json' },
						{ label: 'CSV', value: 'csv' },
						{ label: 'TXT', value: 'txt' },
					]}
				/>

				{format === 'json' ? (
					<Stack gap="sm">
						<TextInput
							label="JSON array path"
							placeholder="users or payload.users"
							description="Leave empty if the file itself is the array. Use dot notation for nested keys."
							value={jsonPath}
							onChange={(e) => setJsonPath(e.target.value)}
						/>
						<TextInput
							label="JSON ID key"
							placeholder="discordId"
							description="The field inside each object that contains the identifier to process."
							value={jsonIdKey}
							onChange={(e) => setJsonIdKey(e.target.value)}
						/>
					</Stack>
				) : format === 'csv' ? (
					<TextInput
						label="CSV column"
						placeholder="discord_id"
						description="The column header that contains the identifier to process."
						value={csvColumn}
						onChange={(e) => setCsvColumn(e.target.value)}
					/>
				) : (
					<></>
				)}
				<Button mt="md" disabled={!file} onClick={handlePrepareData}>
					Prepare Data
				</Button>
			</Stack>
			<Button
				mt="md"
				fullWidth
				variant="outline"
				onClick={() => {
					adminUserBatchAction(null, { step: 'delete' }).then((res) => {
						console.log(res);
						if (res.status === 'success') {
							alert(`Data deleted.`);
						} else {
							alert(`Error deleting data: ${res.error}`);
						}
					});
				}}
			>
				Delete Data
			</Button>
		</Paper>
	);
}
