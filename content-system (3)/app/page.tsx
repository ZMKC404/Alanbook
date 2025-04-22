"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import {
  Search,
  Moon,
  Sun,
  Calendar,
  FileOutputIcon as FileExport,
  Heart,
  MoreVertical,
  Pin,
  Trash,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import html2canvas from "html2canvas"

// Define types
interface Post {
  id: number
  content: string
  time: string
  likes: number
  liked: boolean
  title?: string
  pinned?: boolean
}

export default function ContentSystem() {
  // State
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDirectory, setShowDirectory] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [streakCount, setStreakCount] = useState(0)
  const [totalWordCount, setTotalWordCount] = useState(0)
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])

  const postCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Load saved posts and theme from localStorage on component mount
  useEffect(() => {
    const savedPosts = localStorage.getItem("posts")
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts))
    }

    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }

    // Calculate streak count
    calculateStreakCount()
  }, [])

  // Update filtered posts when posts or search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPosts(posts)
    } else {
      const filtered = posts.filter(
        (post) =>
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredPosts(filtered)
    }

    // Calculate total character count (instead of word count)
    const count = posts.reduce((total, post) => {
      return total + post.content.length
    }, 0)
    setTotalWordCount(count)
  }, [posts, searchQuery])

  // Calculate streak count
  const calculateStreakCount = () => {
    if (posts.length === 0) {
      setStreakCount(0)
      return
    }

    // Sort posts by date
    const sortedPosts = [...posts].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    // Get unique dates
    const uniqueDates = new Set<string>()
    sortedPosts.forEach((post) => {
      const date = new Date(post.time).toLocaleDateString()
      uniqueDates.add(date)
    })

    // Convert to array and sort
    const dates = Array.from(uniqueDates).map((dateStr) => new Date(dateStr))
    dates.sort((a, b) => b.getTime() - a.getTime())

    // Calculate streak
    let streak = 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if there's a post today
    const mostRecentDate = dates[0]
    const dayDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24))

    // If no post today, streak might be broken
    if (dayDiff > 1) {
      setStreakCount(0)
      return
    }

    // Count consecutive days
    for (let i = 0; i < dates.length - 1; i++) {
      const currentDate = dates[i]
      const nextDate = dates[i + 1]

      const diffTime = currentDate.getTime() - nextDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }

    setStreakCount(streak)
  }

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get month format
  const getMonthFormat = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit" })
  }

  // Generate month title
  const generateMonthTitle = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    return `${year}年${month}月`
  }

  // Group posts by month
  const groupPostsByMonth = (postsToGroup: Post[]) => {
    const groupedPosts: { [key: string]: Post[] } = {}

    postsToGroup.forEach((post) => {
      const monthKey = getMonthFormat(post.time)
      if (!groupedPosts[monthKey]) {
        groupedPosts[monthKey] = []
      }
      groupedPosts[monthKey].push(post)
    })

    return groupedPosts
  }

  // Check if content starts with punctuation
  const startsWithPunctuation = (content: string): boolean => {
    if (!content || content.length === 0) return false
    const firstChar = content.trim()[0]
    // Chinese punctuation and common punctuation
    const punctuationRegex = /[？。！，、；：""''（）《》【】「」『』〔〕…—～·.?!,:;'"()[\]{}<>]/
    return punctuationRegex.test(firstChar)
  }

  // Create new post
  const createNewPost = () => {
    if (newPost.trim()) {
      const newPostObj: Post = {
        id: Date.now(),
        content: newPost,
        time: new Date().toISOString(),
        likes: 0,
        liked: false,
        title: generateTitle(newPost),
      }

      const updatedPosts = [...posts, newPostObj]
      setPosts(updatedPosts)
      localStorage.setItem("posts", JSON.stringify(updatedPosts))
      setNewPost("")

      // Update streak count
      calculateStreakCount()
    }
  }

  // Generate a simple title from content
  const generateTitle = (content: string) => {
    const words = content.trim().split(/\s+/)
    const title = words.slice(0, 5).join(" ")
    return title.length < content.length ? `${title}...` : title
  }

  // Toggle like on a post
  const toggleLike = (id: number) => {
    const updatedPosts = posts.map((post) => {
      if (post.id === id) {
        const isLiked = !post.liked
        return {
          ...post,
          liked: isLiked,
          likes: isLiked ? post.likes + 1 : post.likes - 1,
        }
      }
      return post
    })

    setPosts(updatedPosts)
    localStorage.setItem("posts", JSON.stringify(updatedPosts))
  }

  // Delete a post
  const deletePost = (id: number) => {
    if (window.confirm("确定要删除这条内容吗？")) {
      const updatedPosts = posts.filter((post) => post.id !== id)
      setPosts(updatedPosts)
      localStorage.setItem("posts", JSON.stringify(updatedPosts))

      // Update streak count
      calculateStreakCount()
    }
  }

  // Toggle pin status
  const togglePin = (id: number) => {
    const updatedPosts = posts.map((post) => {
      if (post.id === id) {
        return { ...post, pinned: !post.pinned }
      }
      return post
    })

    setPosts(updatedPosts)
    localStorage.setItem("posts", JSON.stringify(updatedPosts))
  }

  // Export post as image
  const exportAsImage = async (id: number) => {
    const element = postCardRefs.current[`post-${id}`]
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: theme === "dark" ? "#1e1e1e" : "#ffffff",
        scale: 2,
      })

      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `content-${id}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Export failed:", error)
      alert("导出图片失败，请重试")
    }
  }

  // Export all content as markdown
  const exportAllAsMarkdown = () => {
    let textContent = `# 阿霖的内容生态\n\n`

    if (posts.length > 0) {
      const sortedPosts = [...posts].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

      // Generate table of contents
      textContent += `## 目录\n\n`

      sortedPosts.forEach((post, index) => {
        const title = post.title || "未命名内容"
        const indexStr = String(index + 1).padStart(3, "0")
        textContent += `${indexStr}. [${title}](#${indexStr})\n`
      })

      textContent += `\n---\n\n`

      // Generate content
      sortedPosts.forEach((post, index) => {
        const date = formatDate(post.time)
        const title = post.title || "未命名内容"
        const indexStr = String(index + 1).padStart(3, "0")
        textContent += `## <a id="${indexStr}"></a>${indexStr} - ${title}\n\n`
        textContent += `*${date}*\n\n${post.content}\n\n---\n\n`
      })
    } else {
      textContent += "暂无内容\n"
    }

    // Create download
    const blob = new Blob([textContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `阿霖的内容生态_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Handle Enter key in textarea
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      createNewPost()
    }
  }

  // Sort posts with pinned ones first
  const sortPosts = (postsToSort: Post[]) => {
    return [...postsToSort].sort((a, b) => {
      // First sort by pinned status
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1

      // Then sort by date (newest first)
      return new Date(b.time).getTime() - new Date(a.time).getTime()
    })
  }

  // Filter posts for directory that start with punctuation
  const getDirectoryPosts = () => {
    return posts.filter((post) => startsWithPunctuation(post.content))
  }

  // Prepare posts for display
  const postsToDisplay = sortPosts(filteredPosts)
  const groupedPosts = groupPostsByMonth(postsToDisplay)
  const months = Object.keys(groupedPosts).sort().reverse()
  const directoryPosts = getDirectoryPosts()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-200">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal font-['KingHwa_OldSong']">阿霖的内容生态</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-['KingHwa_OldSong']">窄门科创出品</p>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-['KingHwa_OldSong']">
              已连续 <span className="font-bold text-black dark:text-white">{streakCount}</span> 天，共{" "}
              <span className="font-bold text-black dark:text-white">{totalWordCount}</span> 字
            </div>
          </div>

          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDirectory(!showDirectory)}
              className="font-['KingHwa_OldSong']"
            >
              <Calendar className="h-4 w-4 mr-2" />
              目录
            </Button>

            <Button variant="outline" size="sm" onClick={toggleTheme} className="font-['KingHwa_OldSong']">
              {theme === "light" ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
              {theme === "light" ? "夜间" : "日间"}
            </Button>

            <Button variant="outline" size="sm" onClick={exportAllAsMarkdown} className="font-['KingHwa_OldSong']">
              <FileExport className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-['KingHwa_OldSong']"
            />
          </div>
        </div>

        {/* Directory */}
        {showDirectory && (
          <Card className="mb-6 p-4 font-['KingHwa_OldSong']">
            <h2 className="text-xl mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">目录索引</h2>
            {directoryPosts.length > 0 ? (
              <ul className="space-y-2">
                {sortPosts(directoryPosts).map((post, index) => (
                  <li key={post.id} className="flex justify-between items-center">
                    <a
                      href={`#post-${post.id}`}
                      className="hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 flex items-center"
                    >
                      <span className={cn("mr-2", post.pinned && "text-red-600 dark:text-red-400")}>
                        {post.pinned && <Pin className="h-3 w-3 inline mr-1" />}
                        {String(index + 1).padStart(3, "0")}.
                      </span>
                      {post.title || "未命名内容"}
                    </a>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.time).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">暂无内容</p>
            )}
          </Card>
        )}

        {/* Post Form */}
        <Card className="mb-6 p-4">
          <Textarea
            placeholder="分享你的想法..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] mb-4 resize-y font-['KingHwa_OldSong']"
          />
          <div className="flex justify-end">
            <Button onClick={createNewPost} className="font-['KingHwa_OldSong']">
              发布
            </Button>
          </div>
        </Card>

        {/* Timeline */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-['KingHwa_OldSong']">暂无内容</div>
          ) : (
            months.map((month) => (
              <div key={month} className="space-y-4">
                <h2 className="text-xl font-['KingHwa_OldSong']">{generateMonthTitle(month)}</h2>

                {groupedPosts[month].map((post) => (
                  <Card
                    key={post.id}
                    id={`post-${post.id}`}
                    className={cn(
                      "p-4 transition-all duration-200 hover:shadow-xl",
                      post.pinned && "border-l-4 border-l-red-600 dark:border-l-red-400",
                    )}
                    ref={(el) => (postCardRefs.current[`post-${post.id}`] = el)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-['KingHwa_OldSong']">
                        {formatDate(post.time)}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => togglePin(post.id)}>
                            <Pin className="h-4 w-4 mr-2" />
                            <span className="font-['KingHwa_OldSong']">{post.pinned ? "取消置顶" : "置顶"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportAsImage(post.id)}>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            <span className="font-['KingHwa_OldSong']">导出为图片</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deletePost(post.id)}>
                            <Trash className="h-4 w-4 mr-2" />
                            <span className="font-['KingHwa_OldSong']">删除</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div
                      className="mb-4 whitespace-pre-wrap font-['KingHwa_OldSong'] select-none"
                      style={{ userSelect: "none" }}
                    >
                      {post.content}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id)}
                        className={cn(
                          "transition-all duration-300 transform",
                          post.liked && "text-red-600 dark:text-red-400 scale-110",
                        )}
                      >
                        <Heart
                          className={cn("h-4 w-4 mr-1 transition-all duration-300", post.liked ? "fill-current" : "")}
                        />
                        <span className="font-['KingHwa_OldSong']">{post.likes}</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
