"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Trash2, Clipboard } from "lucide-react"
import { toast } from "sonner"
import { openDB } from "idb"

const initDB = async () => {
  return openDB("NotionLikeEditor", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("apiKey")) {
        db.createObjectStore("apiKey", { keyPath: "id" })
      }
    },
  })
}

export default function ApiKeyManager() {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [tempApiKey, setTempApiKey] = useState("")

  useEffect(() => {
    const getApiKey = async () => {
      try {
        const db = await initDB()
        const key = await db.get("apiKey", "current")
        if (key?.value) {
          setApiKey(key.value)
          setShowApiKey(true)
        } else {
          setIsDialogOpen(true)
        }
      } catch (error) {
        console.error("Error fetching API key from IndexedDB:", error)
        setIsDialogOpen(true)
      }
    }
    getApiKey()
  }, [])

  const handlePasteApiKey = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setTempApiKey(text)
    } catch (err) {
      console.error("Failed to read clipboard:", err)
    }
  }

  const handleEdit = () => {
    setTempApiKey(apiKey)
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const saveApiKey = async (key: string) => {
    try {
      const db = await initDB()
      await db.put("apiKey", { id: "current", value: key })
      setApiKey(key)
      setShowApiKey(true)
      setIsDialogOpen(false)
      setIsEditMode(false)
      setTempApiKey("")
      toast.success(isEditMode ? "API key updated successfully" : "API key added successfully")
    } catch (error) {
      console.error("Error saving API key:", error)
      toast.error("Failed to save API key")
    }
  }

  const handleDelete = async () => {
    try {
      const db = await initDB()
      await db.delete("apiKey", "current")
      setApiKey("")
      setShowApiKey(false)
      setTempApiKey("")
      toast.success("API key deleted successfully")
    } catch (error) {
      console.error("Error deleting API key:", error)
      toast.error("Failed to delete API key")
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setIsEditMode(false)
      setTempApiKey("")
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {showApiKey ? (
          <>
            <span>API Key: ••••••••</span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
            Add API Key
          </Button>
        )}
      </div>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={handleDialogClose}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit API Key' : 'Enter API Key'}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 items-center">
            <Input
              type="password"
              placeholder="Enter your API key"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handlePasteApiKey}
              title="Paste from clipboard"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => saveApiKey(tempApiKey)}>
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}