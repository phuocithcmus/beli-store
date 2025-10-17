/**
 * Select Component Test
 * Testing that Select components work properly with default values
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SelectTest() {
  const [selectedValue1, setSelectedValue1] = useState('option2'); // Default value
  const [selectedValue2, setSelectedValue2] = useState(''); // No default value

  return (
    <Card className="mx-auto mt-8 w-96">
      <CardHeader>
        <CardTitle>Select Component Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test 1: Select with default value */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Select with default value: {selectedValue1}
          </label>
          <Select value={selectedValue1} onValueChange={setSelectedValue1}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2 (Default)</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Test 2: Select without default value */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Select without default: {selectedValue2 || 'None'}
          </label>
          <Select value={selectedValue2} onValueChange={setSelectedValue2}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Display current values */}
        <div className="rounded bg-gray-50 p-3 text-sm">
          <p>
            <strong>Current Values:</strong>
          </p>
          <p>Select 1: {selectedValue1}</p>
          <p>Select 2: {selectedValue2 || 'Not selected'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
